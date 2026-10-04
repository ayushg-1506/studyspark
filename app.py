import os
import json
import re
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Initialize Gemini client with Gemma model
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemma-4-31b-it"


def call_gemma(prompt, max_tokens=4096):
    """Call Gemma model via Google AI API with retry and fallback."""
    models_to_try = [
        "gemini-1.5-flash", # Fast model for snappy demo and screenshots
        "gemma-4-26b-a4b-it"
    ]
    
    last_error = None
    for model in models_to_try:
        try:
            print(f"Attempting generation with {model}...")
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": max_tokens,
                }
            )
            return response.text
        except Exception as e:
            print(f"Error calling {model}: {e}")
            last_error = e
            continue
            
    raise last_error


def parse_json_response(text):
    """Extract JSON from model response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
    if json_match:
        text = json_match.group(1)
    
    # Clean up the text
    text = text.strip()
    
    # Try parsing as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try finding array or object
    for pattern in [r'(\[[\s\S]*\])', r'(\{[\s\S]*\})']:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    
    raise ValueError(f"Could not parse JSON from response: {text[:200]}")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate-flashcards", methods=["POST"])
def generate_flashcards():
    data = request.json
    notes = data.get("notes", "")
    num_cards = data.get("num_cards", 10)
    
    if not notes.strip():
        return jsonify({"error": "Please provide some notes"}), 400
    
    prompt = f"""You are StudySpark, an AI study assistant. Generate exactly {num_cards} flashcards from the following study notes.

RULES:
- Each flashcard must have a clear, specific question on the front and a concise, accurate answer on the back
- Questions should test understanding, not just memorization
- Cover the most important concepts from the notes
- Vary question types: definitions, explanations, comparisons, applications

Return ONLY a valid JSON array with no other text. Each object must have "front" and "back" keys.
Example format:
[{{"front": "What is X?", "back": "X is..."}}]

NOTES:
{notes}"""
    
    try:
        response = call_gemma(prompt)
        flashcards = parse_json_response(response)
        return jsonify({"flashcards": flashcards})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    data = request.json
    notes = data.get("notes", "")
    num_questions = data.get("num_questions", 5)
    
    if not notes.strip():
        return jsonify({"error": "Please provide some notes"}), 400
    
    prompt = f"""You are StudySpark, an AI study assistant. Generate exactly {num_questions} multiple-choice quiz questions from the following study notes.

RULES:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Wrong options should be plausible but clearly incorrect
- Questions should test understanding of key concepts
- Include a brief explanation for the correct answer

Return ONLY a valid JSON array with no other text. Each object must have these keys:
- "question": the question text
- "options": array of exactly 4 strings
- "correct": index of correct option (0-3)  
- "explanation": brief explanation of why the answer is correct

Example:
[{{"question": "What is...?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": 0, "explanation": "Because..."}}]

NOTES:
{notes}"""
    
    try:
        response = call_gemma(prompt)
        quiz = parse_json_response(response)
        return jsonify({"quiz": quiz})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate-summary", methods=["POST"])
def generate_summary():
    data = request.json
    notes = data.get("notes", "")
    
    if not notes.strip():
        return jsonify({"error": "Please provide some notes"}), 400
    
    prompt = f"""You are StudySpark, an AI study assistant. Create a comprehensive yet concise study summary from the following notes.

RULES:
- Organize by key topics/themes
- Highlight the most important concepts
- Use bullet points for clarity
- Include key terms and definitions
- Add connections between concepts where relevant
- Keep it concise but complete

Return ONLY a valid JSON object with no other text:
{{"title": "Summary title", "sections": [{{"heading": "Topic", "points": ["point 1", "point 2"]}}], "key_terms": [{{"term": "Term", "definition": "Definition"}}]}}

NOTES:
{notes}"""
    
    try:
        response = call_gemma(prompt)
        summary = parse_json_response(response)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/explain", methods=["POST"])
def explain_concept():
    """Explain a concept the student is struggling with."""
    data = request.json
    concept = data.get("concept", "")
    context = data.get("context", "")
    
    if not concept.strip():
        return jsonify({"error": "Please provide a concept to explain"}), 400
    
    prompt = f"""You are StudySpark, a patient and encouraging AI study buddy. Your friend is struggling with a concept and needs your help.

Explain this concept in a simple, friendly way:
Concept: {concept}
{"Context from their notes: " + context if context else ""}

RULES:
- Use simple language and analogies
- Break complex ideas into smaller steps
- Give a real-world example
- Be encouraging and supportive
- Keep it concise (3-4 paragraphs max)

Return ONLY a valid JSON object:
{{"explanation": "Your explanation here", "analogy": "A simple analogy", "example": "A real-world example", "tip": "A study tip for remembering this"}}"""
    
    try:
        response = call_gemma(prompt)
        explanation = parse_json_response(response)
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)

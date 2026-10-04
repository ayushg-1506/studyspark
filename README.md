# ⚡ StudySpark — AI Study Buddy

> **Built for Hacktoberfest 2026 Weekend Challenge: Build for a Friend**

StudySpark turns your messy notes into flashcards, quizzes, and summaries — powered by **Gemma**, Google's open-weight AI model. Your notes stay private. Always.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.1-green?style=flat-square)
![Gemma](https://img.shields.io/badge/AI-Gemma%203-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 📇 **Smart Flashcards** — AI-generated cards that test understanding, not just memorization
- 🧠 **Adaptive Quizzes** — Multiple-choice questions with explanations
- 📋 **Key Summaries** — Organized summaries with key terms and concept connections
- 💡 **Concept Explainer** — Stuck on something? Get simple, friendly explanations
- 🔒 **Privacy First** — Notes are processed per-session, never stored permanently
- ⌨️ **Keyboard Shortcuts** — Arrow keys to navigate, Space to flip, 1/2/3 to rate

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- A [Google AI Studio API key](https://aistudio.google.com/apikey) (free)

### Setup

```bash
# Clone the repo
git clone https://github.com/ayushg-1506/studyspark.git
cd studyspark

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run!
python app.py
```

Open [http://localhost:5000](http://localhost:5000) and start studying! ⚡

## 🏗️ Architecture

```
StudySpark
├── app.py                 # Flask backend + Gemma API integration
├── templates/
│   └── index.html         # Single-page application
├── static/
│   ├── css/style.css      # Dark neon design system
│   └── js/app.js          # Frontend logic + state management
├── requirements.txt       # Python dependencies
└── .env                   # API key (not committed)
```

## 🤖 AI Model

StudySpark uses **Gemma 3 27B IT** — Google's open-weight language model — via the Google AI Studio API. Gemma is:
- **Open-weight**: Full model weights are publicly available
- **Privacy-friendly**: Can be run locally for complete data privacy
- **Free**: Google AI Studio provides free API access
- **Capable**: 27B parameters for high-quality study material generation

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🎃 Hacktoberfest 2026

This project was built for the **Hacktoberfest Weekend Challenge: Build for a Friend**.
Built with ❤️ to help friends study smarter, not harder.

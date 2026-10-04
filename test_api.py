import requests

data = {
    "notes": "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose."
}
response = requests.post("http://localhost:5000/api/generate-flashcards", json=data)
print(response.status_code)
print(response.json())

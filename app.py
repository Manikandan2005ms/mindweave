import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

from google import genai
from google.genai import types

# Load .env file if present
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set. Set env var or .env file.")

# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/analyze", methods=["POST"])
def analyze_text():
    data = request.get_json()
    user_text = data.get("text", "").strip()

    if not user_text:
        return jsonify({"error": "Text is required"}), 400

    # Prompt for Gemini 3 Pro
    system_prompt = """
You are MindWeave, an AI that analyzes human thinking.

Given a piece of text that represents a user's thoughts, ideas, or explanation, you MUST return a STRICT JSON object with the following structure:

{
  "main_idea": "short one sentence summary of the overall idea",
  "sub_ideas": [
    {
      "title": "short title",
      "summary": "2-3 sentence explanation"
    }
  ],
  "clarity_score": 0,
  "emotion": "one of: neutral, confident, anxious, excited, sad, angry, mixed",
  "logic_gaps": [
    "description of a missing reason or unclear step"
  ],
  "improvements": [
    "specific suggestion to clarify or strengthen the idea"
  ]
}

Rules:
- clarity_score is an integer 0–100 (higher = more clear and logically structured).
- If there are no logic issues, logic_gaps can be an empty array.
- improvements should be concrete and actionable.
- Respond ONLY with valid JSON, no extra text.
"""

    full_prompt = (
        system_prompt
        + "\n\nUSER_TEXT:\n\"\"\"\n"
        + user_text
        + "\n\"\"\"\n"
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        # response.text should be a JSON string
        result_json = json.loads(response.text)

        return jsonify(result_json)

    except Exception as e:
        # For debug in dev; in production you’d log this instead
        print("Gemini error:", e)
        return jsonify({"error": "Failed to analyze text", "details": str(e)}), 500


if __name__ == "__main__":
    # Debug=True for local dev only
    app.run(host="0.0.0.0", port=5000, debug=True)

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import ollama
import uuid
import random
import re
import time
import json
import logging

logging.basicConfig(level=logging.INFO)

# --------------------------
# Static fallback questions
# --------------------------
static_questions = {
    "easy": [
        {"text": "What is 2 + 2?", "options": ["2", "3", "4", "5"], "correct_index": 2},
        {"text": "Which planet is known as the Red Planet?",
         "options": ["Earth", "Mars", "Venus", "Jupiter"], "correct_index": 1}
    ],
    "medium": [
        {"text": "What is the square root of 81?",
         "options": ["7", "8", "9", "10"], "correct_index": 2},
        {"text": "In Python, what does len([10,20,30]) return?",
         "options": ["2", "3", "30", "Error"], "correct_index": 1}
    ],
    "hard": [
        {"text": "What is the time complexity of binary search?",
         "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "correct_index": 1},
        {"text": "Which algorithm is used in PageRank?",
         "options": ["K-means", "Gradient Descent", "Markov Chain", "Dijkstra"], "correct_index": 2}
    ]
}

# --------------------------
# FastAPI setup
# --------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

sessions = {}

# --------------------------
# Helpers
# --------------------------
def _clean_choice(s: str) -> str:
    if not isinstance(s, str):
        s = str(s)
    s = s.strip()
    # remove leading labels like "A) ", "B. ", "1) "
    s = re.sub(r"^\s*([A-Da-d1-4])[\.\)]\s*", "", s)
    # collapse spaces
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def _normalize_unique(options):
    seen = set()
    out = []
    for o in options:
        c = _clean_choice(o)
        if c and c.lower() not in seen:
            out.append(c)
            seen.add(c.lower())
    return out

def _fallback(level="easy"):
    q = random.choice(static_questions[level]).copy()
    q["id"] = str(uuid.uuid4())
    q["difficulty"] = level
    return q

# --------------------------
# Question generator (Ollama)
# We ask for: text + correct_answer + 3 distractors,
# then we build options and compute correct_index ourselves.
# --------------------------
def generate_question(level="easy", topic="math"):
    prompt = f"""
You are a quiz generator. Create ONE {level} difficulty multiple-choice question on the topic "{topic}".

Return STRICT JSON ONLY (no markdown, no prose). Use exactly these keys:
{{
  "text": "question here",
  "correct_answer": "the single correct answer, short",
  "distractors": ["wrong but plausible", "wrong but plausible", "wrong but plausible"]
}}

Rules:
- The JSON must be a single object (not inside code fences).
- No labels like "A)" inside answers.
- Answers must be concise, same style as the question requires.
- Distractors must be clearly incorrect but plausible.
- Do NOT include any extra keys.
"""

    try:
        response = ollama.chat(
            model="mistral",
            messages=[
                {"role": "system", "content": "Return only valid JSON as instructed."},
                {"role": "user", "content": prompt}
            ]
        )
        raw = response["message"]["content"].strip()
        logging.info(f"Ollama raw: {raw}")

        # Extract JSON object if any extra text sneaks in
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            raw = m.group(0)

        data = json.loads(raw)

        text = data.get("text", "").strip()
        correct = _clean_choice(data.get("correct_answer", ""))
        distractors = data.get("distractors", [])

        if not text or not correct or not isinstance(distractors, list):
            raise ValueError("Missing fields in model output")

        # Clean + build options
        distractors = [_clean_choice(d) for d in distractors if d]
        options = _normalize_unique([correct] + distractors)

        # ensure 4 options; if fewer, fail to fallback for reliability
        if len(options) < 4:
            raise ValueError("Not enough unique options from model")

        # only first 4 to keep consistent UI
        options = options[:4]
        random.shuffle(options)
        correct_index = options.index(correct)

        return {
            "id": str(uuid.uuid4()),
            "text": text,
            "options": options,
            "correct_index": correct_index,
            "difficulty": level
        }

    except Exception as e:
        logging.error(f"⚠️ Ollama failed or invalid JSON: {e}")
        return _fallback(level)

# --------------------------
# Request Models
# --------------------------
class StartRequest(BaseModel):
    user_id: str
    topic: str

class AnswerRequest(BaseModel):
    session_id: str
    answer_index: int
    time_taken: float
    question_id: str | None = None

# --------------------------
# Endpoints
# --------------------------
@app.post("/start")
def start_quiz(req: StartRequest):
    session_id = f"sess_{int(time.time())}"
    first_q = generate_question(level="easy", topic=req.topic)

    sessions[session_id] = {
        "score": 0,
        "answered": 0,
        "level": "easy",
        "last_question": first_q,
        "topic": req.topic
    }
    return {"session_id": session_id, "question": first_q, "progress": sessions[session_id]}

@app.get("/")
def welcome():
    return {"message": "Welcome to the Quiz API!"}

@app.post("/answer")
def submit_answer(req: AnswerRequest):
    session = sessions.get(req.session_id)
    if not session:
        return {"error": "session not found"}

    last_q = session.get("last_question")
    correct = False
    if last_q is not None:
        try:
            # Ensure index within bounds
            if 0 <= req.answer_index < len(last_q["options"]):
                correct = (req.answer_index == last_q["correct_index"])
        except Exception:
            correct = False

    if correct:
        session["score"] += 1
        explanation = "Correct ✅"
    else:
        explanation = f"Incorrect ❌"

    session["answered"] += 1

    # Adaptive difficulty thresholds
    if session["score"] >= 4:
        session["level"] = "hard"
    elif session["score"] >= 2:
        session["level"] = "medium"
    else:
        session["level"] = "easy"

    next_q = generate_question(level=session["level"], topic=session.get("topic", "math"))
    session["last_question"] = next_q

    return {
        "correct": correct,
        "explanation": explanation,
        "next_question": next_q,
        "progress": session
    }

@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    return sessions.get(session_id, {"error": "session not found"})

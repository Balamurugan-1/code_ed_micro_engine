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

def generate_learning_content(question_text, correct_answer):
    prompt = f"""
    The user just answered a question incorrectly.
    Question: "{question_text}"
    The correct answer was: "{correct_answer}"

    Provide a concise, bite-sized "micro-learning" explanation of the core concept.
    Keep it simple and encouraging. Start with a phrase like "Let's review this concept."
    Return a single paragraph of plain text.
    """
    try:
        response = ollama.chat(
            model="llama3.2:3b",
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
    except Exception as e:
        logging.error(f"⚠️ Ollama content generation failed: {e}")
        return f"Let's review this. The correct answer to '{question_text}' is {correct_answer}."
    

# --- Static fallback questions (unchanged) ---
static_questions = {
    "easy": [
        {"text": "What is 2 + 2?", "options": ["2", "3", "4", "5"], "correct_index": 2},
        {"text": "Which planet is known as the Red Planet?", "options": ["Earth", "Mars", "Venus", "Jupiter"], "correct_index": 1}
    ],
    "medium": [
        {"text": "What is the square root of 81?", "options": ["7", "8", "9", "10"], "correct_index": 2},
        {"text": "In Python, what does len([10,20,30]) return?", "options": ["2", "3", "30", "Error"], "correct_index": 1}
    ],
    "hard": [
        {"text": "What is the time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "correct_index": 1},
        {"text": "Which algorithm is used in PageRank?", "options": ["K-means", "Gradient Descent", "Markov Chain", "Dijkstra"], "correct_index": 2}
    ]
}

# --- FastAPI Setup (unchanged) ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

sessions = {}

# --- Helper Functions (unchanged) ---
def _clean_choice(s: str) -> str:
    if not isinstance(s, str):
        s = str(s)
    s = s.strip()
    s = re.sub(r"^\s*([A-Da-d1-4])[\.\)]\s*", "", s)
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

# --- 💡 NEW: Enhanced Question Generator ---
def generate_question(level="easy", topic="math"):
    prompt = f"""
You are a quiz generator. Create ONE {level} difficulty multiple-choice question on the topic "{topic}".

Return STRICT JSON ONLY (no markdown, no prose). Use exactly these keys:
{{
  "text": "question here",
  "correct_answer": "the single correct answer, short",
  "distractors": ["wrong but plausible", "wrong but plausible", "wrong but plausible"]
}}

Here is an example of the format I want:
{{
  "text": "What is the capital of France?",
  "correct_answer": "Paris",
  "distractors": ["London", "Berlin", "Rome"]
}}

Rules:
- The JSON must be a single object.
- No labels like "A)" inside answers.
- Answers must be concise.
- Distractors must be clearly incorrect but plausible.
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

        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            raw = m.group(0)

        data = json.loads(raw)
        text = data.get("text", "").strip()
        correct = _clean_choice(data.get("correct_answer", ""))
        distractors = data.get("distractors", [])

        if not text or not correct or not isinstance(distractors, list) or len(distractors) < 3:
            raise ValueError("Missing or invalid fields in model output")

        distractors = [_clean_choice(d) for d in distractors if d]
        options = _normalize_unique([correct] + distractors)

        if len(options) < 4:
            raise ValueError("Not enough unique options from model")

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

#explaination gen
def generate_explanation(question_text, correct_answer):
    prompt = f"""
    Explain concisely why "{correct_answer}" is the correct answer for the question: "{question_text}"
    Be helpful and encouraging.
    """
    try:
        response = ollama.chat(
            model="mistral",
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
    except Exception as e:
        logging.error(f"⚠️ Ollama explanation failed: {e}")
        return f"The correct answer is {correct_answer}."


# --- Pydantic Models (unchanged) ---
class StartRequest(BaseModel):
    user_id: str
    topic: str

class AnswerRequest(BaseModel):
    session_id: str
    answer_index: int
    time_taken: float
    question_id: str | None = None

# --- Endpoints ---
@app.post("/start")
def start_quiz(req: StartRequest):
    session_id = f"sess_{int(time.time())}"
    first_q = generate_question(level="easy", topic=req.topic)
    
    # 💡 NEW: Keep track of all questions for the final report
    sessions[session_id] = {
        "user_id": req.user_id,
        "score": 0,
        "answered": 0,
        "level": "easy",
        "last_question": first_q,
        "topic": req.topic,
        "question_history": [] # To store questions for the results page
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
    if last_q and 0 <= req.answer_index < len(last_q["options"]):
        correct = (req.answer_index == last_q["correct_index"])
    
    # 💡 NEW: Add the answered question to history for the results page
    session["question_history"].append({
        "text": last_q["text"],
        "options": last_q["options"],
        "correct_index": last_q["correct_index"],
        "user_answer_index": req.answer_index,
        "is_correct": correct
    })

    # --- 💡 NEW: Dynamic Difficulty and Scoring ---
    current_level = session["level"]
    explanation = ""

    if correct:
        session["score"] += 1 # Simplified scoring for now
        next_level = "medium" if session["level"] == "easy" else "hard"
        session["level"] = next_level
        
        explanation = "Correct! ✅ Let's try something tougher."
        next_q = generate_question(level=session["level"], topic=session.get("topic", "math"))
        session["last_question"] = next_q
        next_step = {"type": "question", "data": next_q}

    else:
        # User got it wrong, provide a learning moment
        next_level = "medium" if session["level"] == "hard" else "easy"
        session["level"] = next_level
        
        correct_answer_text = last_q["options"][last_q["correct_index"]]
        learning_content = generate_learning_content(last_q["text"], correct_answer_text)
        
        # The next question will be based on the new, easier level
        next_q = generate_question(level=session["level"], topic=session.get("topic", "math"))
        session["last_question"] = next_q
        
        next_step = {
            "type": "content", 
            "data": {
                "title": "Let's Review!",
                "content": learning_content,
                "next_question": next_q
            }
        }
        explanation = f"Not quite. The correct answer was **{correct_answer_text}**."

    session["answered"] += 1

    return {
        "correct": correct,
        "explanation": explanation,
        "correct_index": last_q["correct_index"],
        "next_step": next_step, # Return next_step instead of next_question
        "progress": session
    }
@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    return sessions.get(session_id, {"error": "session not found"})
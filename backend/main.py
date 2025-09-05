from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware
import random
import re
import time
import logging
logging.basicConfig(level=logging.INFO)


static_questions = {
    "easy": [
        {
            "text": "What is 2 + 2?",
            "options": ["2", "3", "4", "5"],
            "correct_index": 2
        },
        {
            "text": "Which planet is known as the Red Planet?",
            "options": ["Earth", "Mars", "Venus", "Jupiter"],
            "correct_index": 1
        }
    ],
    "medium": [
        {
            "text": "What is the square root of 81?",
            "options": ["7", "8", "9", "10"],
            "correct_index": 2
        },
        {
            "text": "In Python, what does len([10,20,30]) return?",
            "options": ["2", "3", "30", "Error"],
            "correct_index": 1
        }
    ],
    "hard": [
        {
            "text": "What is the time complexity of binary search?",
            "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            "correct_index": 1
        },
        {
            "text": "Which algorithm is used in PageRank?",
            "options": ["K-means", "Gradient Descent", "Markov Chain", "Dijkstra"],
            "correct_index": 2
        }
    ]
}

app = FastAPI()
qg_pipeline = pipeline("text2text-generation", model="google/flan-t5-small")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sessions = {}

def generate_question(level="easy", topic="math"):
    prompt = f"""
    Create a {level} difficulty multiple-choice question on {topic}.
    Return strict JSON like:
    {{
      "text": "What is 2+2?",
      "options": ["2", "3", "4", "5"],
      "correct_index": 2
    }}
    """

    try:
        result = qg_pipeline(prompt, max_length=200, num_return_sequences=1)
        raw_text = result[0]["generated_text"]

        import json
        parsed = json.loads(raw_text)

        # If it's a list, take first element
        if isinstance(parsed, list):
            parsed = parsed[0]

        return {
            "text": parsed.get("text", "Fallback Question"),
            "options": parsed.get("options", ["A", "B", "C", "D"]),
            "correct_index": parsed.get("correct_index", 0),
            "difficulty": level
        }
    except Exception as e:
        print("Error in generate_question:", e)
        return random.choice(static_questions[level])



class StartRequest(BaseModel):
    user_id: str
    topic: str

class AnswerRequest(BaseModel):
    session_id: str
    answer_index: int
    time_taken: float
    question_id: str | None = None


@app.post("/start")
def start_quiz(req: StartRequest):
    logging.info(f"/start hit with: {req}")
    session_id = f"sess_{int(time.time())}"
    first_q = {
        "id": "q1",
        "text": "What does 2 + 2 equal?",
        "options": ["2", "3", "4", "5"],
        "correct_index": 2,
        "difficulty": "easy"
    }
    sessions[session_id] = {
        "score": 0,
        "answered": 0,
        "level": "Beginner",
        "last_question": first_q  
    }
    return {
        "session_id": session_id,
        "question": first_q,
        "progress": sessions[session_id]
    }


@app.get("/")
def welcome():
    return {"message": "Welcome to the Quiz API!"}

@app.post("/answer")
def submit_answer(req: AnswerRequest):
    session = sessions.get(req.session_id, {})
    last_question = session.get("last_question")

    correct = False
    if last_question and req.answer_index == last_question["correct_index"]:
        correct = True

    if correct:
        session["score"] += 1
        explanation = "Correct ✅"
    else:
        explanation = "Incorrect ❌"

    session["answered"] += 1
    session["level"] = "medium" if session["score"] > 1 else "easy"


    # generate new question
    next_q = generate_question(level=session["level"], topic="math")
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

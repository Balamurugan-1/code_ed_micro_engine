from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware
import re
import time


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
    prompt = f"Create a {level} difficulty multiple-choice question on {topic}. " \
             f"Format as: Question: <text> Options: [A)... B)... C)... D)...] Correct: <letter>"

    result = qg_pipeline(prompt, max_length=150, num_return_sequences=1)
    raw_text = result[0]["generated_text"]

    # Extract parts with regex
    question_match = re.search(r"Question:\s*(.*)", raw_text)
    options_match = re.findall(r"[A-D]\)\s*([^,\n]+)", raw_text)
    correct_match = re.search(r"Correct:\s*([A-D])", raw_text)

    question = question_match.group(1).strip() if question_match else "Unknown question"
    options = [opt.strip() for opt in options_match] if options_match else []
    correct_index = ord(correct_match.group(1)) - ord("A") if correct_match else 0

    return {
        "text": question,
        "options": options,
        "correct_index": correct_index,
        "difficulty": level
    }

class StartRequest(BaseModel):
    user_id: str
    topic: str

class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer_index: int
    time_taken: float


@app.post("/start")
def start_quiz(req: StartRequest):
    session_id = f"sess_{int(time.time())}"
    sessions[session_id] = {
        "score": 0,
        "answered": 0,
        "level": "Beginner"
    }
    return {
        "session_id": session_id,
        "question": {
            "id": "q1",
            "text": "What does 2 + 2 equal?",
            "options": ["2", "3", "4", "5"],
            "difficulty": "easy"
        },
        "progress": sessions[session_id]
    }


@app.get("/")
def welcome():
    return {"message": "Welcome to the Quiz API!"}

@app.post("/answer")
def submit_answer(req: AnswerRequest):
    session = sessions.get(req.session_id, {})

    # For now: dummy check (in future, compare with question's correct_index)
    correct = (req.answer_index == 2)

    if correct:
        session["score"] += 1
        explanation = "Correct!"
    else:
        explanation = "Incorrect."

    session["answered"] += 1
    session["level"] = "Intermediate" if session["score"] > 0 else "Beginner"

    # Generate next question dynamically
    next_q = generate_question(level=session["level"], topic="math")

    return {
        "correct": correct,
        "explanation": explanation,
        "next_question": next_q,
        "progress": session
    }



@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    return sessions.get(session_id, {"error": "session not found"})

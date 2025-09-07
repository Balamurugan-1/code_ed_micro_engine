from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from models import (
    StartRequest, AnswerRequest, UserCreate, UserLogin, User, QuizHistory
)
import services
import database
from auth import verify_password, get_password_hash

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def welcome():
    return {"message": "Welcome to the AI Micro-Learning Engine API!"}


@app.post("/register")
def register_user(user_data: UserCreate):
    if database.get_user(user_data.user_id):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user_data.password)
    user = User(user_id=user_data.user_id, hashed_password=hashed_password)
    database.create_user(user)
    return {"user_id": user.user_id, "message": "User created successfully"}

@app.post("/login")
def login_user(user_data: UserLogin):
    user = database.get_user(user_data.user_id)
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"user_id": user.user_id, "message": "Login successful"}


@app.post("/start")
def start_quiz(req: StartRequest):
    session = services.create_new_session(req)
    return {
        "session_id": session.session_id,
        "question": session.last_question,
        "progress": session.progress
    }

@app.post("/answer")
def submit_answer(req: AnswerRequest):
    try:
        session, response = services.process_user_answer(req)
        
        # if quiz is complete, save to history and delete active session
        if session.progress.answered >= session.total_questions:
            history = QuizHistory(
                user_id=session.user_id,
                session_id=session.session_id,
                course=session.course,
                topic=session.topic,
                progress=session.progress
            )
            database.save_quiz_history(history)
            database.delete_session(session.session_id)

        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/history/{user_id}")
def get_user_history(user_id: str):
    if not database.get_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    history = database.get_quiz_history_for_user(user_id)
    return history

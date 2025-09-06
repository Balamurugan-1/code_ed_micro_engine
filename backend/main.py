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

from models import Session, Question, Progress, StartRequest, AnswerRequest, NextStep, AnswerResponse
import prompts
import database
import services

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

@app.post("/start")
def start_quiz(req: StartRequest):
    """
    Starts a new quiz session.
    """
    session = services.create_new_session(req)
    return {
        "session_id": session.session_id,
        "question": session.last_question,
        "progress": session.progress
    }

@app.post("/answer")
def submit_answer(req: AnswerRequest):
    """
    Submits an answer and gets the next step.
    """
    try:
        session, response = services.process_user_answer(req)
        return response
    except ValueError as e:
        return {"error": str(e)}

@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    """
    Gets the current progress of a session.
    """
    session = database.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return session.progress
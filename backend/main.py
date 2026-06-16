import os
import logging

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from models import (
    StartRequest, AnswerRequest, UserCreate, UserLogin, User, QuizHistory,
    ExplainRequest, HintRequest, CoachRequest
)
import services
import database
from auth import verify_password, get_password_hash, create_access_token, decode_token

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Micro-Learning Engine API")

# Comma-separated list of allowed origins, e.g.
#   ALLOWED_ORIGINS=https://my-app.vercel.app,http://localhost:3000
# Defaults to local dev origins.
_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
allowed_origins = [o.strip() for o in _origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Resolve and validate the bearer token, returning the user_id."""
    user_id = decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


def _authorize_session(session_id: str, current_user: str):
    """Fetch a session and ensure it belongs to the authenticated user."""
    session = database.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    return session


@app.on_event("startup")
def on_startup():
    database.initialize_db()


@app.get("/")
def welcome():
    return {"message": "Welcome to the AI Micro-Learning Engine API!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/register")
def register_user(user_data: UserCreate):
    if database.get_user(user_data.user_id):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user_data.password)
    user = User(user_id=user_data.user_id, hashed_password=hashed_password)
    database.create_user(user)
    token = create_access_token(user.user_id)
    return {"user_id": user.user_id, "access_token": token, "token_type": "bearer"}


@app.post("/login")
def login_user(user_data: UserLogin):
    user = database.get_user(user_data.user_id)
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token(user.user_id)
    return {"user_id": user.user_id, "access_token": token, "token_type": "bearer"}


@app.post("/start")
def start_quiz(req: StartRequest, current_user: str = Depends(get_current_user)):
    # The session is always owned by the authenticated user, regardless of
    # what the client puts in the body.
    req.user_id = current_user
    session = services.create_new_session(req)
    return {
        "session_id": session.session_id,
        "question": session.last_question,
        "progress": session.progress,
    }


@app.post("/answer")
def submit_answer(req: AnswerRequest, current_user: str = Depends(get_current_user)):
    _authorize_session(req.session_id, current_user)
    try:
        session, response = services.process_user_answer(req)

        # If the quiz is complete, archive it and clear the active session.
        if session.progress.answered >= session.total_questions:
            _archive_session(session)

        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/finish")
def finish_quiz(req: AnswerRequest, current_user: str = Depends(get_current_user)):
    """Ends a session early, saving whatever progress exists as history."""
    if not req.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    session = _authorize_session(req.session_id, current_user)
    _archive_session(session)
    return {"message": "Session finished", "progress": session.progress}


def _archive_session(session):
    history = QuizHistory(
        user_id=session.user_id,
        session_id=session.session_id,
        course=session.course,
        topic=session.topic,
        progress=session.progress,
    )
    database.save_quiz_history(history)
    database.delete_session(session.session_id)


@app.post("/explain")
def explain_question(req: ExplainRequest, current_user: str = Depends(get_current_user)):
    return {"explanation": services.generate_explanation(req.question_text, req.correct_answer)}


@app.post("/hint")
def hint_question(req: HintRequest, current_user: str = Depends(get_current_user)):
    return {"hint": services.generate_hint(req.question_text, req.options)}


@app.post("/coach")
def coach_feedback(req: CoachRequest, current_user: str = Depends(get_current_user)):
    feedback = services.generate_session_coach(
        req.course, req.topic, req.score, req.question_history
    )
    return {"feedback": feedback}


@app.get("/history/{user_id}")
def get_user_history(user_id: str, current_user: str = Depends(get_current_user)):
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not database.get_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return database.get_quiz_history_for_user(user_id)


@app.get("/analytics/{user_id}")
def get_user_analytics(user_id: str, current_user: str = Depends(get_current_user)):
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not database.get_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    history = database.get_quiz_history_for_user(user_id)
    return services.compute_analytics(history)

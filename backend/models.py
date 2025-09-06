# backend/models.py
from pydantic import BaseModel
from typing import List, Dict, Any

# --- API Request/Response Models ---

class StartRequest(BaseModel):
    user_id: str
    topic: str

class AnswerRequest(BaseModel):
    session_id: str
    answer_index: int
    time_taken: float

class Question(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_index: int
    difficulty: str
    skill: str # Added for granular tracking

class Progress(BaseModel):
    score: float
    answered: int
    level: str
    competence_map: Dict[str, float] # New competence model

class NextStep(BaseModel):
    type: str  # "question" or "content"
    data: Any

class AnswerResponse(BaseModel):
    correct: bool
    explanation: str
    correct_index: int
    next_step: NextStep
    progress: Progress

class Progress(BaseModel):
    score: float
    answered: int
    level: str
    competence_map: Dict[str, float]
    question_history: List[Dict] = []

# --- Internal Session Model ---

class Session(BaseModel):
    session_id: str
    user_id: str
    topic: str
    progress: Progress
    question_history: List[Dict] = []
    last_question: Question | None = None
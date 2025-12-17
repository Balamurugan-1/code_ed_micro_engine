from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    user_id: str
    password: str

class UserLogin(BaseModel):
    user_id: str
    password: str

class User(BaseModel):
    user_id: str
    hashed_password: str

class StartRequest(BaseModel):
    user_id: str
    topic: str
    course: str
    num_questions: int = Field(default=5, ge=1, le=20)

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
    skill: str

class Progress(BaseModel):
    score: float
    answered: int
    total_questions: int
    level: str
    competence_map: Dict[str, float]
    question_history: List[Dict] = []

class NextStep(BaseModel):
    type: str
    data: Any

class AnswerResponse(BaseModel):
    correct: bool
    explanation: str
    correct_index: int
    next_step: NextStep
    progress: Progress

class Session(BaseModel):
    session_id: str
    user_id: str
    topic: str
    course: str
    total_questions: int
    progress: Progress
    question_history: List[Dict] = []
    last_question: Question | None = None

class QuizHistory(BaseModel):
    user_id: str
    session_id: str
    course: str
    topic: str
    progress: Progress
    completed_at: datetime = Field(default_factory=datetime.utcnow)


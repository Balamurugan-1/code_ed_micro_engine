# backend/database.py
import sqlite3
import json
from models import Session, User, QuizHistory

DB_FILE = "quiz_sessions.db"

def initialize_db():
    """Creates all necessary tables if they don't exist."""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                hashed_password TEXT NOT NULL
            )
        """)
        # Sessions table (still used for active quizzes)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                session_data TEXT NOT NULL
            )
        """)
        # Quiz History table for completed quizzes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_history (
                history_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT NOT NULL UNIQUE,
                history_data TEXT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        conn.commit()

# --- User Management ---
def create_user(user: User):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (user_id, hashed_password) VALUES (?, ?)",
            (user.user_id, user.hashed_password)
        )
        conn.commit()

def get_user(user_id: str) -> User | None:
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return User(**row)
    return None

# --- Active Session Management ---
def save_session(session: Session):
    session_data = session.model_dump_json()
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO sessions (session_id, session_data) VALUES (?, ?)",
            (session.session_id, session_data)
        )
        conn.commit()

def get_session(session_id: str) -> Session | None:
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT session_data FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            return Session.model_validate_json(row[0])
    return None
    
def delete_session(session_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()

# --- Quiz History Management ---
def save_quiz_history(history: QuizHistory):
    history_data = history.model_dump_json()
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO quiz_history (user_id, session_id, history_data) VALUES (?, ?, ?)",
            (history.user_id, history.session_id, history_data)
        )
        conn.commit()
        
def get_quiz_history_for_user(user_id: str) -> list[QuizHistory]:
    history_list = []
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT history_data FROM quiz_history WHERE user_id = ? ORDER BY completed_at DESC", (user_id,))
        rows = cursor.fetchall()
        for row in rows:
            history_list.append(QuizHistory.model_validate_json(row[0]))
    return history_list


# Initialize the database when the application starts
initialize_db()

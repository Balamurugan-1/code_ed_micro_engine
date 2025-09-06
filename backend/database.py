# backend/database.py
import sqlite3
import json
from models import Session

DB_FILE = "quiz_sessions.db"

def initialize_db():
    """Creates the sessions table if it doesn't exist."""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                session_data TEXT NOT NULL
            )
        """)
        conn.commit()

def save_session(session: Session):
    """Saves or updates a session in the database."""
    session_data = session.model_dump_json()
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO sessions (session_id, session_data) VALUES (?, ?)",
            (session.session_id, session_data)
        )
        conn.commit()

def get_session(session_id: str) -> Session | None:
    """Retrieves a session from the database."""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT session_data FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            return Session.model_validate_json(row[0])
    return None

# Initialize the database when the application starts
initialize_db()
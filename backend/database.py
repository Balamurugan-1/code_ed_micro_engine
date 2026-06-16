# backend/database.py
"""PostgreSQL (Neon) data-access layer.

Sessions and quiz history are stored as JSON text blobs so the Pydantic
models in models.py remain the single source of truth for their shape.
The connection string is read from the DATABASE_URL environment variable,
e.g. the value Neon gives you:

    postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
"""
import os
import logging
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from models import Session, User, QuizHistory

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Add your Neon connection string to the "
        "environment (see backend/.env.example)."
    )

# Neon requires SSL. Append it if the caller forgot.
if "sslmode=" not in DATABASE_URL:
    sep = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"

# A small connection pool keeps latency low without exhausting Neon's limits.
_pool = pool.SimpleConnectionPool(minconn=1, maxconn=10, dsn=DATABASE_URL)


@contextmanager
def get_connection():
    """Borrow a connection from the pool and return it when done."""
    conn = _pool.getconn()
    try:
        yield conn
    finally:
        _pool.putconn(conn)


def initialize_db():
    """Creates all necessary tables if they don't exist."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    hashed_password TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    session_data TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS quiz_history (
                    history_id BIGSERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users (user_id),
                    session_id TEXT NOT NULL UNIQUE,
                    history_data TEXT NOT NULL,
                    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_quiz_history_user "
                "ON quiz_history (user_id, completed_at DESC)"
            )
        conn.commit()
    logger.info("Database initialized.")


def create_user(user: User):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (user_id, hashed_password) VALUES (%s, %s)",
                (user.user_id, user.hashed_password),
            )
        conn.commit()


def get_user(user_id: str) -> User | None:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            row = cursor.fetchone()
            if row:
                return User(**row)
    return None


def save_session(session: Session):
    session_data = session.model_dump_json()
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO sessions (session_id, session_data)
                VALUES (%s, %s)
                ON CONFLICT (session_id)
                DO UPDATE SET session_data = EXCLUDED.session_data
                """,
                (session.session_id, session_data),
            )
        conn.commit()


def get_session(session_id: str) -> Session | None:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT session_data FROM sessions WHERE session_id = %s",
                (session_id,),
            )
            row = cursor.fetchone()
            if row:
                return Session.model_validate_json(row[0])
    return None


def delete_session(session_id: str):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM sessions WHERE session_id = %s", (session_id,)
            )
        conn.commit()


def save_quiz_history(history: QuizHistory):
    history_data = history.model_dump_json()
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO quiz_history (user_id, session_id, history_data)
                VALUES (%s, %s, %s)
                ON CONFLICT (session_id) DO NOTHING
                """,
                (history.user_id, history.session_id, history_data),
            )
        conn.commit()


def get_quiz_history_for_user(user_id: str) -> list[QuizHistory]:
    history_list = []
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT history_data FROM quiz_history "
                "WHERE user_id = %s ORDER BY completed_at DESC",
                (user_id,),
            )
            for row in cursor.fetchall():
                history_list.append(QuizHistory.model_validate_json(row[0]))
    return history_list

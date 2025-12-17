# backend/database.py
import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError
from models import Session, User, QuizHistory

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = "code_ed_micro_engine"

client = None
db = None

def get_db():
    """Returns the database instance, reconnecting if necessary."""
    global client, db
    if client is None:
        if not MONGO_URI:
            logger.error("MONGODB_URI is not set in environment variables.")
            raise ValueError("MONGODB_URI is not set.")
        try:
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            logger.info("Successfully connected to MongoDB.")
        except PyMongoError as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    return db

def initialize_db():
    """Creates indexes for efficient querying."""
    database = get_db()
    try:
        database.users.create_index("user_id", unique=True)
        
        database.sessions.create_index("session_id", unique=True)
        
        database.quiz_history.create_index([("user_id", 1), ("completed_at", DESCENDING)])
        
        logger.info("Database indexes verified.")
    except PyMongoError as e:
        logger.error(f"Error creating indexes: {e}")


def create_user(user: User):
    database = get_db()
    try:
        database.users.insert_one(user.model_dump())
    except PyMongoError as e:
        logger.error(f"Error creating user: {e}")
        raise

def get_user(user_id: str) -> User | None:
    database = get_db()
    try:
        user_doc = database.users.find_one({"user_id": user_id})
        if user_doc:
            return User(**user_doc)
    except PyMongoError as e:
        logger.error(f"Error fetching user: {e}")
    return None


def save_session(session: Session):
    """
    Saves the current state of the quiz session (checkpoint).
    Uses upsert=True to create if not exists, or replace if exists.
    """
    database = get_db()
    try:
        session_data = session.model_dump()
        
        database.sessions.replace_one(
            {"session_id": session.session_id},
            session_data,
            upsert=True
        )
    except PyMongoError as e:
        logger.error(f"Error saving session checkpoint: {e}")
        raise

def get_session(session_id: str) -> Session | None:
    database = get_db()
    try:
        session_doc = database.sessions.find_one({"session_id": session_id})
        if session_doc:
            return Session.model_validate(session_doc)
    except PyMongoError as e:
        logger.error(f"Error fetching session: {e}")
    return None

def delete_session(session_id: str):
    database = get_db()
    try:
        database.sessions.delete_one({"session_id": session_id})
    except PyMongoError as e:
        logger.error(f"Error deleting session: {e}")


def save_quiz_history(history: QuizHistory):
    database = get_db()
    try:
        database.quiz_history.insert_one(history.model_dump())
    except PyMongoError as e:
        logger.error(f"Error saving history: {e}")

def get_quiz_history_for_user(user_id: str) -> list[QuizHistory]:
    database = get_db()
    history_list = []
    try:
        cursor = database.quiz_history.find({"user_id": user_id}).sort("completed_at", DESCENDING)
        for doc in cursor:
            history_list.append(QuizHistory.model_validate(doc))
    except PyMongoError as e:
        logger.error(f"Error fetching history: {e}")
    return history_list

try:
    initialize_db()
except Exception as e:
    logger.warning(f"Database initialization deferred or failed: {e}")
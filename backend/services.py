# backend/services.py
import os
import uuid
import random
import re
import json
import logging
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Iterable

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from models import Session, Question, Progress, StartRequest, AnswerRequest, NextStep, AnswerResponse
import prompts
import database

# --- Gemini API Configuration ---
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    generation_config = GenerationConfig(response_mime_type="application/json")
    model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)
    text_model = genai.GenerativeModel('gemini-2.5-flash') # For plain text responses
except Exception as e:
    logging.error(f"Failed to configure Gemini API: {e}")
    model = None
    text_model = None


logging.basicConfig(level=logging.INFO)

# --- Helper Functions ---
def _clean_choice(s: str) -> str:
    if not isinstance(s, str): s = str(s)
    s = s.strip()
    s = re.sub(r"^\s*([A-Da-d1-4])[\.\)]\s*", "", s)
    return s.strip()

def _normalize_unique(options: list) -> list:
    seen, out = set(), []
    for o in options:
        c = _clean_choice(o)
        if c and c.lower() not in seen:
            out.append(c)
            seen.add(c.lower())
    return out

# --- AI Interaction Service ---

def _generate_ai_question(level: str, topic: str, course: str) -> Question:
    if not model:
        raise ConnectionError("Gemini model not initialized. Check API key.")

    prompt_text = prompts.get_question_prompt(level, topic, course)
    try:
        response = model.generate_content(prompt_text)
        data = json.loads(response.text)
        
        text = data.get("text", "").strip()
        correct = _clean_choice(data.get("correct_answer", ""))
        skill = data.get("skill", topic)
        distractors = _normalize_unique(data.get("distractors", []))

        if not all([text, correct, len(distractors) >= 3]):
            raise ValueError("Missing or invalid fields from model output")

        options = _normalize_unique([correct] + distractors)[:4]
        random.shuffle(options)
        
        if correct not in options:
             options[random.randint(0, 3)] = correct

        return Question(
            id=str(uuid.uuid4()),
            text=text,
            options=options,
            correct_index=options.index(correct),
            difficulty=level,
            skill=skill
        )
    except Exception as e:
        logging.error(f"⚠️ AI question generation failed: {e}. Using fallback.")
        return Question(id=str(uuid.uuid4()), text=f"What is a key concept in {topic}?", options=["A", "B", "C", "D"], correct_index=0, difficulty=level, skill=topic)


# --- Question Cache / Background Queue ---------------------------------------
# To cut latency and Gemini quota, generated questions are pooled per
# (course, topic, difficulty). Requests are served instantly from the pool when
# possible, and the pool is topped up by a background worker so the next request
# is already waiting. Pools are reused across users/sessions, which reduces the
# total number of generations; repeats *within* a single session are avoided via
# the `seen_texts` filter.

_POOL_LOCK = threading.Lock()
_QUESTION_POOLS: Dict[tuple, list] = {}   # key -> list[Question]
_PENDING: Dict[tuple, int] = {}           # key -> in-flight generations
_executor = ThreadPoolExecutor(max_workers=4)

MAX_POOL = 12      # hard cap of cached questions per key
TARGET_POOL = 6    # desired warm pool size


def _pool_key(course: str, topic: str, level: str) -> tuple:
    return (course.strip().lower(), topic.strip().lower(), level)


def _is_fallback(q: Question) -> bool:
    """Don't cache the generic fallback question produced on AI failure."""
    return q.options == ["A", "B", "C", "D"]


def _add_to_pool(key: tuple, q: Question):
    if _is_fallback(q):
        return
    with _POOL_LOCK:
        pool = _QUESTION_POOLS.setdefault(key, [])
        if len(pool) < MAX_POOL and all(existing.text != q.text for existing in pool):
            pool.append(q)


def _background_fill(level: str, topic: str, course: str):
    key = _pool_key(course, topic, level)
    try:
        q = _generate_ai_question(level=level, topic=topic, course=course)
        _add_to_pool(key, q)
    except Exception as e:
        logging.error(f"⚠️ Background question fill failed: {e}")
    finally:
        with _POOL_LOCK:
            _PENDING[key] = max(0, _PENDING.get(key, 1) - 1)


def _maybe_top_up(level: str, topic: str, course: str):
    """Queue background generations until the pool reaches TARGET_POOL."""
    key = _pool_key(course, topic, level)
    with _POOL_LOCK:
        have = len(_QUESTION_POOLS.get(key, [])) + _PENDING.get(key, 0)
        needed = max(0, TARGET_POOL - have)
        _PENDING[key] = _PENDING.get(key, 0) + needed
    for _ in range(needed):
        _executor.submit(_background_fill, level, topic, course)


def get_cached_question(level: str, topic: str, course: str, seen_texts: Iterable[str] = ()) -> Question:
    """Return a question, preferring the warm pool and falling back to a live
    generation only when nothing reusable is cached."""
    key = _pool_key(course, topic, level)
    seen = set(seen_texts or ())

    with _POOL_LOCK:
        pool = _QUESTION_POOLS.get(key, [])
        candidates = [q for q in pool if q.text not in seen]
        chosen = random.choice(candidates) if candidates else None

    if chosen is None:
        # Cold pool (or everything already seen this session) → generate now.
        chosen = _generate_ai_question(level=level, topic=topic, course=course)
        _add_to_pool(key, chosen)

    # Keep the pool warm for the next request.
    _maybe_top_up(level, topic, course)

    # Hand back a unique instance so ids never collide across serves.
    return chosen.model_copy(update={"id": str(uuid.uuid4())})


def _generate_learning_content(question_text: str, correct_answer: str) -> str:
    """Generates a micro-learning explanation using the AI."""
    if not text_model:
        raise ConnectionError("Gemini model not initialized. Check API key.")

    prompt_text = prompts.get_learning_content_prompt(question_text, correct_answer)
    try:
        response = text_model.generate_content(prompt_text)
        return response.text
    except Exception as e:
        logging.error(f"⚠️ Gemini content generation failed: {e}")
        return f"Let's review this concept. The correct answer to '{question_text}' is **{correct_answer}**."

def generate_explanation(question_text: str, correct_answer: str) -> str:
    """On-demand explanation for why an answer is correct."""
    if not text_model:
        raise ConnectionError("Gemini model not initialized. Check API key.")
    try:
        response = text_model.generate_content(
            prompts.get_explanation_prompt(question_text, correct_answer)
        )
        return response.text.strip()
    except Exception as e:
        logging.error(f"⚠️ Explanation generation failed: {e}")
        return f"The correct answer is **{correct_answer}**. Review the core concept behind this question to understand why."


def generate_hint(question_text: str, options: list) -> str:
    """A nudge that does not reveal the correct option."""
    if not text_model:
        raise ConnectionError("Gemini model not initialized. Check API key.")
    try:
        response = text_model.generate_content(
            prompts.get_hint_prompt(question_text, options)
        )
        return response.text.strip()
    except Exception as e:
        logging.error(f"⚠️ Hint generation failed: {e}")
        return "Think about the key concept the question is testing, and eliminate options that don't fit."


def generate_session_coach(course: str, topic: str, score: float, question_history: list) -> str:
    """A personalized end-of-session coaching note from the AI tutor."""
    if not text_model:
        raise ConnectionError("Gemini model not initialized. Check API key.")

    total = len(question_history)
    correct = sum(1 for q in question_history if q.get("is_correct"))
    accuracy = round((correct / total) * 100) if total else 0

    # Build a compact per-skill summary for the prompt.
    skills: Dict[str, Dict[str, int]] = {}
    for q in question_history:
        skill = q.get("skill") or "General"
        bucket = skills.setdefault(skill, {"correct": 0, "total": 0})
        bucket["total"] += 1
        if q.get("is_correct"):
            bucket["correct"] += 1
    if skills:
        skill_summary = "\n".join(
            f"    - {s}: {d['correct']}/{d['total']} correct" for s, d in skills.items()
        )
    else:
        skill_summary = "    - (no per-skill data)"

    try:
        response = text_model.generate_content(
            prompts.get_session_coach_prompt(course, topic, round(score), accuracy, skill_summary)
        )
        return response.text.strip()
    except Exception as e:
        logging.error(f"⚠️ Coach generation failed: {e}")
        return (
            f"Great effort on **{topic}**! You scored {round(score)} with {accuracy}% accuracy. "
            "Keep practicing the skills you found tricky and revisit the explanations for the ones you missed."
        )


def compute_analytics(history_list: list) -> dict:
    """Aggregate a user's completed-quiz history into dashboard analytics.

    Pure computation over data already stored in Neon — no AI calls.
    """
    total_sessions = len(history_list)
    total_questions = 0
    total_correct = 0
    total_time = 0.0
    timed_questions = 0
    skills: Dict[str, Dict[str, int]] = {}
    courses: Dict[str, Dict[str, int]] = {}
    timeline = []

    # history_list is ordered newest-first; iterate oldest-first for the timeline.
    for h in reversed(history_list):
        qh = h.progress.question_history or []
        s_total = len(qh)
        s_correct = sum(1 for q in qh if q.get("is_correct"))
        total_questions += s_total
        total_correct += s_correct

        for q in qh:
            t = q.get("time_taken")
            if isinstance(t, (int, float)) and t > 0:
                total_time += t
                timed_questions += 1

        s_acc = round((s_correct / s_total) * 100) if s_total else 0
        timeline.append({
            "date": h.completed_at.isoformat(),
            "accuracy": s_acc,
            "label": f"{h.course}: {h.topic}",
        })

        cb = courses.setdefault(h.course, {"correct": 0, "total": 0, "sessions": 0})
        cb["sessions"] += 1
        cb["correct"] += s_correct
        cb["total"] += s_total

        for q in qh:
            skill = q.get("skill") or "General"
            sb = skills.setdefault(skill, {"correct": 0, "total": 0})
            sb["total"] += 1
            if q.get("is_correct"):
                sb["correct"] += 1

    overall_accuracy = round((total_correct / total_questions) * 100) if total_questions else 0
    avg_time_per_question = round(total_time / timed_questions, 1) if timed_questions else 0

    skill_rows = [
        {"skill": s, "correct": d["correct"], "total": d["total"],
         "accuracy": round((d["correct"] / d["total"]) * 100) if d["total"] else 0}
        for s, d in skills.items()
    ]
    skill_rows.sort(key=lambda r: r["accuracy"])  # weakest first

    course_rows = [
        {"course": c, "sessions": d["sessions"],
         "accuracy": round((d["correct"] / d["total"]) * 100) if d["total"] else 0}
        for c, d in courses.items()
    ]

    return {
        "summary": {
            "total_sessions": total_sessions,
            "total_questions": total_questions,
            "total_correct": total_correct,
            "overall_accuracy": overall_accuracy,
            "avg_time_per_question": avg_time_per_question,
            "current_streak": _current_streak(history_list),
        },
        "skills": skill_rows,
        "courses": course_rows,
        "timeline": timeline[-20:],  # cap for display
    }


def _current_streak(history_list: list) -> int:
    """Count consecutive days (ending today or yesterday) with completed quizzes."""
    from datetime import datetime, timedelta

    dates = sorted({h.completed_at.date() for h in history_list}, reverse=True)
    if not dates:
        return 0

    today = datetime.utcnow().date()
    if dates[0] != today and dates[0] != today - timedelta(days=1):
        return 0

    streak = 0
    expected = dates[0]
    for d in dates:
        if d == expected:
            streak += 1
            expected = expected - timedelta(days=1)
        elif d < expected:
            break
    return streak


def create_new_session(req: StartRequest) -> Session:
    session_id = f"sess_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    initial_progress = Progress(
        score=0, 
        answered=0, 
        level="easy", 
        competence_map={},
        total_questions=req.num_questions
    )
    
    session = Session(
        session_id=session_id,
        user_id=req.user_id,
        topic=req.topic,
        course=req.course,
        total_questions=req.num_questions,
        progress=initial_progress,
        question_history=[]
    )
    
    first_question = get_cached_question(level="easy", topic=req.topic, course=req.course)
    session.last_question = first_question
    database.save_session(session)
    return session

def process_user_answer(req: AnswerRequest) -> tuple[Session, AnswerResponse]:
    session = database.get_session(req.session_id)
    if not session:
        raise ValueError("Session not found")

    last_q = session.last_question
    is_correct = (req.answer_index == last_q.correct_index)
    
    skill = last_q.skill
    current_competence = session.progress.competence_map.get(skill, 0.5)
    
    if is_correct:
        adjustment = 0.1 if last_q.difficulty == 'easy' else 0.15 if last_q.difficulty == 'medium' else 0.2
        session.progress.score += 10 * (1 + ['easy', 'medium', 'hard'].index(last_q.difficulty))
    else:
        adjustment = -0.2
        
    session.progress.competence_map[skill] = max(0, min(1, current_competence + adjustment))

    if not session.progress.competence_map:
        next_level = 'easy'
    else:
        min_skill_score = min(session.progress.competence_map.values())
        if min_skill_score < 0.4: next_level = 'easy'
        elif min_skill_score < 0.75: next_level = 'medium'
        else: next_level = 'hard'
    session.progress.level = next_level
    
    next_step: NextStep
    explanation: str

    # This answer completes the quiz, so there is no next question to generate.
    is_last_answer = (session.progress.answered + 1) >= session.total_questions

    # Questions already shown this session, so we don't repeat one.
    seen_texts = {q.get("text") for q in session.question_history} | {last_q.text}

    if is_correct:
        explanation = "Correct! ✅ Let's keep going."
    else:
        correct_answer_text = last_q.options[last_q.correct_index]
        explanation = f"Not quite. The correct answer was **{correct_answer_text}**."

    if is_last_answer:
        next_step = NextStep(type="complete", data=None)
    elif is_correct:
        next_question = get_cached_question(level=next_level, topic=session.topic, course=session.course, seen_texts=seen_texts)
        next_step = NextStep(type="question", data=next_question)
    else:
        correct_answer_text = last_q.options[last_q.correct_index]
        if session.progress.competence_map.get(skill, 0.5) < 0.5:
            learning_content = _generate_learning_content(last_q.text, correct_answer_text)
            next_question = get_cached_question(level=next_level, topic=session.topic, course=session.course, seen_texts=seen_texts)
            content_data = {
                "title": f"Reviewing: {skill}",
                "content": learning_content,
                "next_question": next_question
            }
            next_step = NextStep(type="content", data=content_data)
        else:
            next_question = get_cached_question(level=next_level, topic=session.topic, course=session.course, seen_texts=seen_texts)
            next_step = NextStep(type="question", data=next_question)

    if next_step.type == "question":
        session.last_question = next_step.data
    elif next_step.type == "content":
        session.last_question = next_step.data["next_question"]
    session.progress.answered += 1
    session.question_history.append({
        **last_q.model_dump(),
        "user_answer_index": req.answer_index,
        "is_correct": is_correct,
        "time_taken": round(req.time_taken, 1),
    })
    
    session.progress.question_history = session.question_history

    database.save_session(session)
    
    response = AnswerResponse(
        correct=is_correct,
        explanation=explanation,
        correct_index=last_q.correct_index,
        next_step=next_step,
        progress=session.progress
    )

    return session, response

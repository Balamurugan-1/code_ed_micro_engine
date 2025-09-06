# backend/services.py
import ollama
import uuid
import random
import re
import json
import logging
import time
from typing import Dict

from models import Session, Question, Progress, StartRequest, AnswerRequest, NextStep,AnswerResponse
import prompts
import database

logging.basicConfig(level=logging.INFO)

# --- (Helper functions remain the same) ---
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

def _generate_ai_question(level: str, topic: str) -> Question:
    # This function remains unchanged
    prompt_text = prompts.get_question_prompt(level, topic)
    try:
        response = ollama.chat(model="mistral", messages=[
            {"role": "system", "content": "You are a helpful assistant that only returns valid JSON."},
            {"role": "user", "content": prompt_text}
        ], options={"temperature": 0.8})
        
        raw_content = response["message"]["content"]
        json_match = re.search(r"\{.*\}", raw_content, re.DOTALL)
        if not json_match: raise ValueError("No JSON object found in response")
        
        data = json.loads(json_match.group(0))
        
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


# *** NEW FUNCTION TO FIX THE BUG ***
def _generate_learning_content(question_text: str, correct_answer: str) -> str:
    """Generates a micro-learning explanation using the AI."""
    prompt_text = prompts.get_learning_content_prompt(question_text, correct_answer)
    try:
        response = ollama.chat(
            model="mistral",
            messages=[{"role": "user", "content": prompt_text}]
        )
        return response["message"]["content"]
    except Exception as e:
        logging.error(f"⚠️ Ollama content generation failed: {e}")
        return f"Let's review this concept. The correct answer to '{question_text}' is **{correct_answer}**."


# --- (create_new_session function remains the same) ---
def create_new_session(req: StartRequest) -> Session:
    session_id = f"sess_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    initial_progress = Progress(score=0, answered=0, level="easy", competence_map={})
    
    session = Session(
        session_id=session_id,
        user_id=req.user_id,
        topic=req.topic,
        progress=initial_progress,
        question_history=[]
    )
    
    first_question = _generate_ai_question(level="easy", topic=req.topic)
    session.last_question = first_question
    database.save_session(session)
    return session




def process_user_answer(req: AnswerRequest) -> tuple[Session, AnswerResponse]:
    session = database.get_session(req.session_id)
    if not session:
        raise ValueError("Session not found")

    last_q = session.last_question
    is_correct = (req.answer_index == last_q.correct_index)
    
    # ... (competence map and level logic remains the same) ...
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
    
    # --- Next Step Logic ---
    next_step: NextStep
    explanation: str

    if is_correct:
        explanation = "Correct! ✅ Let's keep going."
        next_question = _generate_ai_question(level=next_level, topic=session.topic)
        next_step = NextStep(type="question", data=next_question)
    else:
        correct_answer_text = last_q.options[last_q.correct_index]
        explanation = f"Not quite. The correct answer was **{correct_answer_text}**."
        
        if session.progress.competence_map[skill] < 0.5:
             # *** BUG FIX IS HERE ***
             # Call the new function to get the AI's response, not the prompt.
             learning_content = _generate_learning_content(last_q.text, correct_answer_text)
             next_question = _generate_ai_question(level=next_level, topic=session.topic)
             content_data = {
                 "title": f"Reviewing: {skill}",
                 "content": learning_content,
                 "next_question": next_question
             }
             next_step = NextStep(type="content", data=content_data)
        else:
             next_question = _generate_ai_question(level=next_level, topic=session.topic)
             next_step = NextStep(type="question", data=next_question)

    # --- (Session state update logic remains the same) ---
    session.last_question = next_step.data if next_step.type == "question" else next_step.data["next_question"]
    session.progress.answered += 1
    session.question_history.append({**last_q.model_dump(), "user_answer_index": req.answer_index, "is_correct": is_correct})
    
    # *** FIX IS HERE ***
    # Sync the session's full history into the progress object before sending
    session.progress.question_history = session.question_history

    database.save_session(session)
    
    response = AnswerResponse(
        correct=is_correct,
        explanation=explanation,
        correct_index=last_q.correct_index,
        next_step=next_step,
        progress=session.progress # This now contains the full history
    )

    return session, response
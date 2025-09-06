# backend/prompts.py

def get_question_prompt(level: str, topic: str) -> str:
    return f"""
You are an expert quiz question writer. Create ONE multiple-choice question on the topic of "{topic}" with a "{level}" difficulty.

Return STRICT JSON ONLY. Use exactly these keys:
{{
  "text": "The question text.",
  "skill": "A specific skill or sub-topic, e.g., 'Calculus: Derivatives' or 'Python: List Comprehensions'.",
  "correct_answer": "The single correct answer text.",
  "distractors": ["A plausible but wrong answer.", "Another plausible but wrong answer.", "A third plausible but wrong answer."]
}}

Rules:
- The JSON response must be a single, complete object.
- Answers and distractors should be concise strings.
- Distractors must be clearly incorrect but relevant to the question's topic.
"""

def get_explanation_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    Explain concisely why "{correct_answer}" is the correct answer for the question: "{question_text}"
    Be helpful, encouraging, and focus on the core concept.
    """

def get_learning_content_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    A learner just answered a question incorrectly.
    Question: "{question_text}"
    Correct answer: "{correct_answer}"

    Provide a concise, bite-sized "micro-learning" explanation of the core concept.
    Keep it simple and encouraging. Start with a phrase like "Let's take a closer look at this concept."
    Return a single paragraph of plain text.
    """
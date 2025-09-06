# backend/prompts.py

def get_question_prompt(level: str, topic: str, course: str) -> str:
    return f"""
You are an expert question writer for higher education. Your output MUST BE a single, valid JSON object and nothing else.
Do not wrap the JSON in markdown backticks or any other text.

Create ONE multiple-choice question for a university-level course.

- Course: "{course}"
- Topic: "{topic}"
- Difficulty: "{level}"

Use this exact JSON structure:
{{
  "text": "The question text.",
  "skill": "A specific skill or sub-topic, e.g., 'Calculus: Derivatives' or 'Python: List Comprehensions'.",
  "correct_answer": "The single correct answer text.",
  "distractors": ["A plausible but wrong answer.", "Another plausible but wrong answer.", "A third plausible but wrong answer."]
}}

Rules:
- The JSON response must be a single, complete object.
- Answers and distractors should be concise strings.
- Distractors must be clearly incorrect but relevant to the question's topic and course level.
- For "hard" questions, focus on application, analysis, or evaluation (Bloom's Taxonomy).
"""

def get_explanation_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    Explain concisely why "{correct_answer}" is the correct answer for the question: "{question_text}"
    Be helpful, encouraging, and focus on the core concept. Provide a university-level explanation.
    """

def get_learning_content_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    A university student just answered a question incorrectly.
    Question: "{question_text}"
    Correct answer: "{correct_answer}"

    Provide a concise, bite-sized "micro-learning" explanation of the core concept suitable for a higher-education audience.
    Keep it simple and encouraging. Start with a phrase like "Let's take a closer look at this concept."
    Return a single paragraph of plain text.
    """
# backend/prompts.py

def get_question_prompt(level: str, topic: str, course: str) -> str:
    return f"""
You are an expert question writer for higher education. Your output MUST BE a single, valid JSON object and nothing else.
Do not wrap the JSON in markdown backticks or any other text.

IMPORTANT: All backslashes (\\) in the JSON string values MUST be escaped. For example, instead of "\\frac", you MUST write "\\\\frac". This is critical for JSON compatibility.

Create ONE multiple-choice question for a university-level course.

- Course: "{course}"
- Topic: "{topic}"
- Difficulty: "{level}"

Use this exact JSON structure:
{{
  "text": "The question text. Use LaTeX for equations, ensuring all backslashes are escaped. Example: 'What is the value of $$\\int x^2 dx$$?'",
  "skill": "A specific skill or sub-topic, e.g., 'Calculus: Integration'.",
  "correct_answer": "The single correct answer. Use LaTeX if needed, ensuring all backslashes are escaped. Example: '$$\\\\frac{{x^3}}{3} + C$$'.",
  "distractors": ["A plausible but wrong answer with escaped backslashes.", "Another plausible but wrong answer with escaped backslashes.", "A third plausible but wrong answer with escaped backslashes."]
}}

Rules:
- ALL mathematical and scientific notation (formulas, variables, symbols) MUST be enclosed in LaTeX delimiters ('$' for inline, '$$' for block).
- All backslashes inside the JSON strings must be escaped (e.g., `\\\\frac`, `\\\\alpha`).
- The JSON response must be a single, complete object.
- Answers and distractors should be concise strings.
- Distractors must be clearly incorrect but relevant to the question's topic and course level.
- For "hard" questions, focus on application, analysis, or evaluation (Bloom's Taxonomy).
"""

def get_explanation_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    Explain concisely why "{correct_answer}" is the correct answer for the question: "{question_text}"
    Be helpful, encouraging, and focus on the core concept. Provide a university-level explanation.
    Use LaTeX for all mathematical and scientific notation, enclosing it in '$' delimiters.
    """

def get_hint_prompt(question_text: str, options: list) -> str:
    options_block = "\n".join(f"- {o}" for o in options)
    return f"""
    A university student is working on this multiple-choice question:
    "{question_text}"

    The available options are:
    {options_block}

    Give ONE short, encouraging hint (1-2 sentences) that nudges the student
    toward the right reasoning WITHOUT revealing or naming the correct option.
    Do not mention which option is correct. Focus on the underlying concept or
    the first step they should think about.
    Use LaTeX for any mathematical or scientific notation, enclosed in '$' delimiters.
    Return plain text only.
    """


def get_session_coach_prompt(course: str, topic: str, score: int, accuracy: int, skill_summary: str) -> str:
    return f"""
    You are a supportive university tutor reviewing a student's completed
    micro-learning session.

    - Course: "{course}"
    - Topic: "{topic}"
    - Marks (accuracy): {accuracy}%
    - Per-skill performance:
    {skill_summary}

    Write a brief, encouraging coaching note (3-4 sentences) that:
    1. Acknowledges what the student did well.
    2. Names their weakest skill and why it matters.
    3. Gives 2 concrete, actionable next steps to improve.
    Be warm and motivating, not generic. Address the student as "you".
    Use LaTeX for any mathematical or scientific notation, enclosed in '$' delimiters.
    Return plain text only (you may use **bold** for emphasis).
    """


def get_learning_content_prompt(question_text: str, correct_answer: str) -> str:
    return f"""
    A university student just answered a question incorrectly.
    Question: "{question_text}"
    Correct answer: "{correct_answer}"

    Provide a concise, bite-sized "micro-learning" explanation of the core concept suitable for a higher-education audience.
    Keep it simple and encouraging. Start with a phrase like "Let's take a closer look at this concept."
    Use LaTeX for all mathematical and scientific notation, enclosing it in '$' delimiters.
    For example: 'The integral of $x^2$ is found using the power rule, which gives $$\\frac{{x^3}}{3} + C$$.'
    Return a single paragraph of plain text with embedded LaTeX.
    """


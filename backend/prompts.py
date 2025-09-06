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
  "text": "The question text. Use LaTeX for equations, e.g., 'What is the value of $$\\int x^2 dx$$?'",
  "skill": "A specific skill or sub-topic, e.g., 'Calculus: Integration'.",
  "correct_answer": "The single correct answer. Use LaTeX if needed, e.g., '$$\\frac{{x^3}}{3} + C$$'.",
  "distractors": ["A plausible but wrong answer.", "Another plausible but wrong answer.", "A third plausible but wrong answer."]
}}

Rules:
- ALL mathematical and scientific notation (formulas, variables, symbols) MUST be enclosed in LaTeX delimiters ('$' for inline, '$$' for block).
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

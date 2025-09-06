# backend/prompts.py

def get_question_prompt(level: str, topic: str) -> str:
    """
    Creates a detailed few-shot prompt for GPT-2 to generate a multiple-choice question.
    By providing high-quality examples, we guide the model to produce a response
    in the desired JSON format and style.
    """
    return f"""
Generate a single, unique, multiple-choice question in valid JSON format based on the provided topic and difficulty.

---
[EXAMPLE 1]
Topic: "Basic Arithmetic"
Difficulty: "easy"
Output:
{{
  "text": "What is the result of 7 multiplied by 6?",
  "skill": "Multiplication",
  "correct_answer": "42",
  "distractors": ["35", "48", "54"]
}}
---
[EXAMPLE 2]
Topic: "Web Development"
Difficulty: "medium"
Output:
{{
  "text": "In CSS, which property is used to change the text color of an element?",
  "skill": "CSS Fundamentals",
  "correct_answer": "color",
  "distractors": ["font-color", "text-color", "font-style"]
}}
---
[EXAMPLE 3]
Topic: "Biology"
Difficulty: "hard"
Output:
{{
  "text": "What is the primary function of mitochondria in a eukaryotic cell?",
  "skill": "Cellular Biology",
  "correct_answer": "ATP synthesis through cellular respiration",
  "distractors": ["Protein synthesis", "Waste breakdown and recycling", "Storing genetic information"]
}}
---
[TASK]
Topic: "{topic}"
Difficulty: "{level}"
Output:
"""

def get_learning_content_prompt(question_text: str, correct_answer: str) -> str:
    """
    Creates a detailed few-shot prompt for GPT-2 to generate a micro-learning explanation.
    The examples guide the model to produce a concise, helpful, and encouraging tone.
    """
    return f"""
You are an AI assistant that provides simple, encouraging, and concise explanations for quiz questions. Below are examples.

---
[EXAMPLE 1]
Question: "What is the capital of Japan?"
Correct Answer: "Tokyo"
Explanation:
Let's review this! The correct answer is **Tokyo**. Tokyo has been the imperial capital of Japan since 1868 and is the most populous city in the country, serving as its political and economic center.
---
[EXAMPLE 2]
Question: "What is the time complexity of a bubble sort algorithm?"
Correct Answer: "O(n^2)"
Explanation:
Let's break this down. The correct answer is **O(n²)**. This is because, in the worst-case scenario, the algorithm needs to compare and potentially swap every element with every other element in the list, resulting in a quadratic time complexity.
---
[TASK]
Question: "{question_text}"
Correct Answer: "{correct_answer}"
Explanation:
"""

def get_explanation_prompt(question_text: str, correct_answer: str) -> str:
    # This can now be an alias for the more detailed learning content prompt
    return get_learning_content_prompt(question_text, correct_answer)
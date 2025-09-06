import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; // backend port

export async function startQuiz(userId, course, topic, numQuestions) {
  const res = await axios.post(`${API_URL}/start`, {
    user_id: userId,
    course: course,
    topic: topic,
    num_questions: numQuestions,
  });
  return res.data;
}

export async function submitAnswer(sessionId, answerIndex, timeTaken, questionId) {
  const res = await axios.post(`${API_URL}/answer`, {
    session_id: sessionId,
    answer_index: answerIndex,
    time_taken: timeTaken,
    question_id: questionId,
  });
  return res.data;
}

import axios from "axios";

const API_URL = "https://code-ed-micro-engine-2.onrender.com";

export async function registerUser(userId, password) {
  const res = await axios.post(`${API_URL}/register`, { user_id: userId, password });
  return res.data;
}

export async function loginUser(userId, password) {
  const res = await axios.post(`${API_URL}/login`, { user_id: userId, password });
  return res.data;
}

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

export async function getHistory(userId) {
  const res = await axios.get(`${API_URL}/history/${userId}`);
  return res.data;
}


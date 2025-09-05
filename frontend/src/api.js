import axios from "axios";

const API_URL = "http://localhost:8000";



export async function startQuiz(userId, topic) {
  const res = await axios.post(`${API_URL}/start`, {
    user_id: userId,
    topic: topic,
  });
  return res.data;
}

export async function submitAnswer(sessionId, questionId, answerIndex, timeTaken) {
  const res = await axios.post(`${API_URL}/answer`, {
    session_id: sessionId,
    question_id: questionId,
    answer_index: answerIndex,
    time_taken: timeTaken,
  });
  return res.data;
}

export async function getProgress(sessionId) {
  const res = await axios.get(`${API_URL}/progress/${sessionId}`);
  return res.data;
}

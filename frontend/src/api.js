import axios from "axios";

// Configurable so the same build works locally and in production.
// Set REACT_APP_API_URL in your hosting provider (e.g. Vercel) env vars.
const API_URL = (
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

// Attach/detach the JWT for all subsequent requests.
export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
}

// If a token expires or is rejected, log the user out automatically — but never
// for a failed login/register attempt (those 401s are "wrong credentials").
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = url.endsWith("/login") || url.endsWith("/register");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      setAuthToken(null);
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export async function registerUser(userId, password) {
  const res = await axios.post(`${API_URL}/register`, { user_id: userId, password });
  return res.data;
}

export async function loginUser(userId, password) {
  const res = await axios.post(`${API_URL}/login`, { user_id: userId, password });
  return res.data;
}

// --- Quiz ---
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

export async function finishQuiz(sessionId) {
  const res = await axios.post(`${API_URL}/finish`, { session_id: sessionId });
  return res.data;
}

// --- AI helpers ---
export async function getHint(questionText, options) {
  const res = await axios.post(`${API_URL}/hint`, {
    question_text: questionText,
    options,
  });
  return res.data.hint;
}

export async function explainQuestion(questionText, correctAnswer) {
  const res = await axios.post(`${API_URL}/explain`, {
    question_text: questionText,
    correct_answer: correctAnswer,
  });
  return res.data.explanation;
}

export async function getCoachFeedback(course, topic, score, questionHistory) {
  const res = await axios.post(`${API_URL}/coach`, {
    course,
    topic,
    score,
    question_history: questionHistory || [],
  });
  return res.data.feedback;
}

// --- History & analytics ---
export async function getHistory(userId) {
  const res = await axios.get(`${API_URL}/history/${userId}`);
  return res.data;
}

export async function getAnalytics(userId) {
  const res = await axios.get(`${API_URL}/analytics/${userId}`);
  return res.data;
}

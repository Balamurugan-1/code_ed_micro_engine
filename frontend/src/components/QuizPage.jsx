import React, { useState, useEffect } from "react";
import { startQuiz, submitAnswer } from "../api";

export default function QuizPage() {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await startQuiz("user123", "math");
      setSessionId(data.session_id);
      setQuestion(data.question);
      setProgress(data.progress);
    }
    init();
  }, []);

  async function handleAnswer(index) {
    setLoading(true);
    const data = await submitAnswer(sessionId, question.id, index, 5);
    setQuestion(data.next_question);
    setProgress(data.progress);
    setLoading(false);
  }

  if (!question) return <p>Loading quiz...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">{question.text}</h2>
      <div className="space-y-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => handleAnswer(idx)}
            disabled={loading}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <p>Progress: {progress?.score} / {progress?.answered}</p>
      </div>
    </div>
  );
}

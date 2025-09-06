import React, { useState, useEffect } from "react";
import QuestionCard from "./QuestionCard";
import ResultPage from "./ResultPage";
import { startQuiz, submitAnswer } from "../api";

export default function QuizPage({ userId, topic, onExit }) {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // start quiz on mount
  useEffect(() => {
    async function initQuiz() {
      setLoading(true);
      try {
        const data = await startQuiz(userId, topic);
        setSessionId(data.session_id);
        setQuestion(data.question);
        setProgress(data.progress);
      } catch (err) {
        console.error("Failed to start quiz:", err);
      }
      setLoading(false);
    }
    initQuiz();
  }, [userId, topic]);

  async function handleAnswer(idx) {
    setLoading(true);
    const startTime = Date.now();
    try {
      const data = await submitAnswer(
        sessionId,
        idx,
        (Date.now() - startTime) / 1000,
        question.id
      );
      setQuestion(data.next_question);
      setProgress(data.progress);

      //mark quiz as completed 
      if (data.progress.answered >= 5) {
        setCompleted(true);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
    setLoading(false);
  }

  if (loading && !question) return <p>Loading quiz...</p>;

  if (completed) {
    return <ResultPage progress={progress} onRestart={onExit} />;
  }

  return (
    <div className="p-6">
      {question && <QuestionCard question={question} onAnswer={handleAnswer} />}

      {progress && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <p><strong>Score:</strong> {progress.score}</p>
          <p><strong>Answered:</strong> {progress.answered}</p>
          <p><strong>Level:</strong> {progress.level}</p>
        </div>
      )}

      <button
        onClick={() => setCompleted(true)}   // ✅ show results instead of exit immediately
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        End Quiz & Show Results
      </button>

    </div>
  );
}

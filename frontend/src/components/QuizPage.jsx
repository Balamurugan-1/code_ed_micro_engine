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
  
  // 💡 NEW state for feedback
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [explanation, setExplanation] = useState("");

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
    setIsAnswered(true);
    setSelectedAnswer(idx);
    
    const startTime = Date.now();
    try {
      const data = await submitAnswer(
        sessionId,
        idx,
        (Date.now() - startTime) / 1000,
        question.id
      );

      setCorrectAnswerIndex(data.correct_index);
      setExplanation(data.explanation);
      setProgress(data.progress);

      // Wait 3 seconds to show feedback before loading the next question
      setTimeout(() => {
        if (data.progress.answered >= 5) {
          setCompleted(true);
        } else {
          setQuestion(data.next_question);
          // Reset feedback state for the new question
          setIsAnswered(false);
          setSelectedAnswer(null);
          setCorrectAnswerIndex(null);
          setExplanation("");
        }
      }, 3000); 

    } catch (err) {
      console.error("Failed to submit answer:", err);
      setIsAnswered(false); // Re-enable if there was an error
    }
  }

  if (loading && !question) return <p>Loading quiz...</p>;

  if (completed) {
    // Pass the question history to the result page
    return <ResultPage progress={progress} questionHistory={progress.question_history} onRestart={onExit} />;
  }

  return (
    <div className="p-6">
      {question && (
        <QuestionCard 
          question={question} 
          onAnswer={handleAnswer}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
          correctAnswerIndex={correctAnswerIndex}
        />
      )}

      {isAnswered && (
        <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
          <p dangerouslySetInnerHTML={{ __html: explanation }}></p>
        </div>
      )}

      {progress && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <p><strong>Score:</strong> {Math.round(progress.score)}</p>
          <p><strong>Answered:</strong> {progress.answered} / 5</p>
          <p><strong>Level:</strong> {progress.level}</p>
        </div>
      )}

      <button
        onClick={() => setCompleted(true)}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        End Quiz & Show Results
      </button>
    </div>
  );
}
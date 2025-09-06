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
  
  // Feedback state
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
      setIsAnswered(false);
    }
  }

  if (loading && !question) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Generating your personalized quiz...</p>
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    );
  }

  if (completed) {
    return <ResultPage progress={progress} questionHistory={progress.question_history} onRestart={onExit} />;
  }

  return (
    <div className="quiz-container">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          onClick={onExit}
          className="btn btn-secondary"
          style={{ 
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '10px 20px'
          }}
        >
          ← Back to Setup
        </button>
        <div style={{ 
          background: 'rgba(78, 205, 196, 0.2)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          📚 {topic}
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <QuestionCard 
          question={question} 
          onAnswer={handleAnswer}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
          correctAnswerIndex={correctAnswerIndex}
        />
      )}

      {/* Explanation */}
      {isAnswered && explanation && (
        <div className={`feedback-card ${
          selectedAnswer === correctAnswerIndex ? 'feedback-success' : 'feedback-error'
        }`}>
          <div className="feedback-content">
            <div className={`feedback-icon ${
              selectedAnswer === correctAnswerIndex ? 'feedback-success' : 'feedback-error'
            }`}>
              {selectedAnswer === correctAnswerIndex ? '✓' : 'i'}
            </div>
            <div style={{ flex: 1 }}>
              <p dangerouslySetInnerHTML={{ __html: explanation }}></p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Card */}
      {progress && (
        <div className="progress-card">
          <div className="progress-header" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Your Progress</h3>
            <div className="progress-score">
              {Math.round(progress.score)}
            </div>
          </div>
          
          <div className="progress-stats">
            <div className="stat-item">
              <div className="stat-value">{progress.answered}</div>
              <div className="stat-label">Questions</div>
            </div>
            <div className="stat-item">
              <div className={`stat-value ${
                progress.level === 'easy' ? 'easy' :
                progress.level === 'medium' ? 'medium' : 'hard'
              }`} style={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '1rem'
              }}>
                {progress.level}
              </div>
              <div className="stat-label">Level</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{5 - progress.answered}</div>
              <div className="stat-label">Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${(progress.answered / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* End Quiz Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => setCompleted(true)}
          className="btn btn-secondary"
          style={{ background: '#6c757d' }}
        >
          End Quiz & Show Results
        </button>
      </div>
    </div>
  );
}
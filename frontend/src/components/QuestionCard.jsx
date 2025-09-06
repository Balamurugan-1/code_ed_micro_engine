import React from "react";
import Latex from "react-latex-next";

export default function QuestionCard({ question, onAnswer, selectedAnswer, correctAnswerIndex, isAnswered }) {
  if (!question) return null;

  const getOptionClass = (idx) => {
    if (!isAnswered) {
      return "option-button";
    }
    if (correctAnswerIndex !== null) {
      if (idx === correctAnswerIndex) {
        return "option-button option-correct";
      }
      if (idx === selectedAnswer && idx !== correctAnswerIndex) {
        return "option-button option-incorrect";
      }
      return "option-button option-neutral";
    }
    if (idx === selectedAnswer) {
      return "option-button option-neutral";
    }
    return "option-button";
  };

  const getDifficultyClass = (difficulty) => {
    const classes = {
      easy: "difficulty-badge difficulty-easy",
      medium: "difficulty-badge difficulty-medium",
      hard: "difficulty-badge difficulty-hard"
    };
    return classes[difficulty] || classes.easy;
  };

  const getResultIcon = () => {
    if (!isAnswered || correctAnswerIndex === null) {
      return null;
    }
    if (selectedAnswer === correctAnswerIndex) {
      return <span style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: 'bold' }}>✅ Correct!</span>;
    }
    return <span style={{ color: '#dc3545', fontSize: '1.2rem', fontWeight: 'bold' }}>❌ Not quite</span>;
  };

  return (
    <div className="card question-card">
      <div className="question-header">
        <div className="question-info">
          <div className="question-icon">?</div>
          <span className={getDifficultyClass(question.difficulty)}>
            {question.difficulty?.toUpperCase() || 'QUESTION'}
          </span>
        </div>
        {getResultIcon()}
      </div>
  
      <div className="question-text">
        <Latex>{question.text}</Latex>
      </div>

      <div className="options-container">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            className={getOptionClass(idx)}
            onClick={() => onAnswer(idx)}
            disabled={isAnswered}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + idx)}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}><Latex>{opt}</Latex></span>
            {isAnswered && correctAnswerIndex !== null && idx === correctAnswerIndex && (
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
            )}
            {isAnswered && correctAnswerIndex !== null && idx === selectedAnswer && idx !== correctAnswerIndex && (
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>✗</span>
            )}
          </button>
        ))}
      </div>

      {isAnswered && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Preparing next question...</p>
        </div>
      )}
    </div>
  );
}

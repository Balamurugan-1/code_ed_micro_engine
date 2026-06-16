import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import { getHint } from "../api";

export default function QuestionCard({ question, onAnswer, selectedAnswer, correctAnswerIndex, isAnswered }) {
  const [hint, setHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);

  // Clear the hint whenever a new question appears.
  useEffect(() => {
    setHint("");
    setHintLoading(false);
  }, [question?.id]);

  if (!question) return null;

  const handleHint = async () => {
    setHintLoading(true);
    try {
      const text = await getHint(question.text, question.options);
      setHint(text);
    } catch (err) {
      console.error("Failed to get hint:", err);
      setHint("Couldn't load a hint right now — try reasoning through the options.");
    }
    setHintLoading(false);
  };

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

      {!isAnswered && (
        <div style={{ marginTop: '22px' }}>
          {!hint && (
            <button className="btn-hint" onClick={handleHint} disabled={hintLoading}>
              💡 {hintLoading ? 'Thinking…' : 'Need a hint?'}
            </button>
          )}
          {hint && (
            <div className="hint-box">
              <strong>💡 Hint:</strong> <Latex>{hint}</Latex>
            </div>
          )}
        </div>
      )}

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

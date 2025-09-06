import React from "react";

/**
 * Displays a "micro-learning" content piece before proceeding to the next question.
 * @param {object} props
 * @param {object} props.content - The content object from the API.
 * @param {function} props.onProceed - Callback function to load the next question.
 */
export default function ContentCard({ content, onProceed }) {
  if (!content) return null;

  return (
    <div className="card" style={{ animation: 'slideUp 0.6s ease-out', marginBottom: '30px', borderLeft: '5px solid #4ecdc4' }}>
      <div className="question-header">
        <div className="question-info">
          <div className="question-icon" style={{ background: 'linear-gradient(135deg, #4ecdc4, #44a08d)' }}>
            💡
          </div>
          <span className="difficulty-badge" style={{ background: '#e4f9f5', color: '#44a08d', border: '1px solid #a7e9e1' }}>
            {content.title || 'LEARNING MOMENT'}
          </span>
        </div>
      </div>
      <div className="question-text" style={{ fontSize: '1.1rem', fontWeight: '400', lineHeight: '1.7' }}>
        {/* Using dangerouslySetInnerHTML to allow for simple formatting like bolding from the AI */}
        <p dangerouslySetInnerHTML={{ __html: content.content }}></p>
      </div>
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={onProceed}
          className="btn btn-success"
        >
          Got it, Next Question →
        </button>
      </div>
    </div>
  );
}
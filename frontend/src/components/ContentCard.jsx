import React from "react";
import Latex from "react-latex-next";

export default function ContentCard({ content, onProceed }) {
  if (!content) return null;

  const renderContent = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|\$\$.*?\$\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return <Latex key={index}>{part}</Latex>;
      }
       if (part.startsWith('$$') && part.endsWith('$$')) {
        return <div key={index} className="latex-block"><Latex displayMode={true}>{part}</Latex></div>;
      }
      return part;
    });
  };

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
        <p>{renderContent(content.content)}</p>
      </div>
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={onProceed}
          className="btn btn-primary"
        >
          Got it, Next Question →
        </button>
      </div>
    </div>
  );
}

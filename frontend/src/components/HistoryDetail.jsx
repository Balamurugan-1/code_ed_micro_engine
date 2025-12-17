import React from 'react';
import ResultPage from './ResultPage';

export default function HistoryDetail({ history, onBack }) {
  if (!history) return null;

  return (
    <div>
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </button>
      <ResultPage
        progress={history.progress}
        questionHistory={history.progress.question_history}
        onRestart={onBack} 
      />
    </div>
  );
}

import React from "react";

export default function ResultPage({ progress, questionHistory, onRestart }) {
  const decodeHTML = (html) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const correctAnswers = questionHistory?.filter(q => q.is_correct).length || 0;
  const totalQuestions = questionHistory?.length || 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  
  const skills = (questionHistory || []).reduce((acc, q) => {
    const skill = q.skill || 'General Knowledge'; 
    if (!acc[skill]) {
      acc[skill] = { correct: 0, total: 0 };
    }
    acc[skill].total++;
    if (q.is_correct) {
      acc[skill].correct++;
    }
    return acc;
  }, {});
  const skillEntries = Object.entries(skills);

  const getPerformanceMessage = () => {
    if (accuracy >= 80) return { message: "Outstanding! 🌟", emoji: "🎉" };
    if (accuracy >= 60) return { message: "Well done! 👍", emoji: "👏" };
    if (accuracy >= 40) return { message: "Good effort! 💪", emoji: "🎯" };
    return { message: "Keep practicing! 🎯", emoji: "💪" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="results-container">
    
      <div className="results-header">
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{performance.emoji}</div>
        <h2 className="results-title">Quiz Completed!</h2>
        <p className="results-subtitle">{performance.message}</p>
      </div>

    
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#667eea' }}>{Math.round(progress.score)}</div>
          <div className="stat-card-label">Final Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#28a745' }}>{correctAnswers}/{totalQuestions}</div>
          <div className="stat-card-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#764ba2' }}>{accuracy}%</div>
          <div className="stat-card-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className={`stat-card-value`} style={{ color: progress.level === 'easy' ? '#28a745' : progress.level === 'medium' ? '#ffc107' : '#dc3545' }}>
            {progress.level}
          </div>
          <div className="stat-card-label">Final Level</div>
        </div>
      </div>

      {skillEntries.length > 0 && (
        <div className="card" style={{ marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🧠 Skill Analysis
          </h3>
          {skillEntries.map(([skill, data]) => {
            const skillAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            const barColor = skillAccuracy >= 75 ? '#28a745' : skillAccuracy >= 50 ? '#ffc107' : '#dc3545';
            return (
              <div key={skill} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: '600' }}>{skill}</span>
                  <span style={{ color: '#555' }}>{data.correct}/{data.total} ({skillAccuracy}%)</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(0,0,0,0.05)' }}>
                  <div className="progress-bar" style={{ width: `${skillAccuracy}%`, background: barColor }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

   
      <div className="review-section">
        <div className="review-header">
          <h3 style={{ margin: 0 }}>📝 Question Review</h3>
        </div>
        <div className="review-content">
          {questionHistory && questionHistory.map((q, index) => (
            <div key={index} className={`review-item ${q.is_correct ? 'review-correct' : 'review-incorrect'}`}>
              <p className="review-question">{index + 1}. {decodeHTML(q.text)}</p>
              <div className="review-answers">
                <div className="review-answer">Your answer: <strong>{decodeHTML(q.options[q.user_answer_index])}</strong> {q.is_correct ? '✓' : '✗'}</div>
                {!q.is_correct && (
                  <div className="review-answer">Correct answer: <strong>{decodeHTML(q.options[q.correct_index])}</strong></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

   
      <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button onClick={onRestart} className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
          🔄 Try Another Topic
        </button>
      </div>
    </div>
  );
}
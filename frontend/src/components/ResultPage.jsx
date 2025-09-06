import React from "react";

export default function ResultPage({ progress, questionHistory, onRestart }) {
  const decodeHTML = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const correctAnswers = questionHistory?.filter(q => q.is_correct).length || 0;
  const totalQuestions = questionHistory?.length || 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const getPerformanceMessage = () => {
    if (accuracy >= 80) return { message: "Outstanding! 🌟", emoji: "🎉" };
    if (accuracy >= 60) return { message: "Well done! 👍", emoji: "👏" };
    if (accuracy >= 40) return { message: "Good effort! 💪", emoji: "🎯" };
    return { message: "Keep practicing! 🎯", emoji: "💪" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="results-container">
      {/* Celebration Header */}
      <div className="results-header">
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
          {performance.emoji}
        </div>
        <h2 className="results-title">Quiz Completed!</h2>
        <p className="results-subtitle">{performance.message}</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#667eea' }}>
            {Math.round(progress.score)}
          </div>
          <div className="stat-card-label">Final Score</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#28a745' }}>
            {correctAnswers}/{totalQuestions}
          </div>
          <div className="stat-card-label">Correct Answers</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#764ba2' }}>
            {accuracy}%
          </div>
          <div className="stat-card-label">Accuracy</div>
        </div>
        
        <div className="stat-card">
          <div className={`stat-card-value`} style={{ 
            color: progress.level === 'easy' ? '#28a745' :
                   progress.level === 'medium' ? '#ffc107' : '#dc3545'
          }}>
            {progress.level}
          </div>
          <div className="stat-card-label">Final Level</div>
        </div>
      </div>

      {/* Accuracy Visualization */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📊 Performance Overview
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '10px',
              fontSize: '0.9rem'
            }}>
              <span>Accuracy</span>
              <span>{accuracy}%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '12px' }}>
              <div 
                className="progress-bar"
                style={{ 
                  width: `${accuracy}%`,
                  background: `linear-gradient(90deg, 
                    ${accuracy >= 80 ? '#28a745' : accuracy >= 60 ? '#4ecdc4' : accuracy >= 40 ? '#ffc107' : '#dc3545'} 0%, 
                    ${accuracy >= 80 ? '#20c997' : accuracy >= 60 ? '#17a2b8' : accuracy >= 40 ? '#fd7e14' : '#e74c3c'} 100%)`
                }}
              ></div>
            </div>
          </div>
          <div style={{ fontSize: '2rem' }}>
            {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🥉' : accuracy >= 40 ? '📈' : '💪'}
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="review-section">
        <div className="review-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            📝 Question Review
          </h3>
        </div>
        
        <div className="review-content">
          {questionHistory && questionHistory.map((q, index) => (
            <div 
              key={index} 
              className={`review-item ${q.is_correct ? 'review-correct' : 'review-incorrect'}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: q.is_correct ? '#28a745' : '#dc3545',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <p className="review-question">
                    {decodeHTML(q.text)}
                  </p>
                  
                  <div className="review-answers">
                    <div className="review-answer" style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Your answer: </span>
                      <span style={{ 
                        fontWeight: '600',
                        color: q.is_correct ? '#155724' : '#721c24',
                        background: q.is_correct ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        {decodeHTML(q.options[q.user_answer_index])}
                      </span>
                      <span style={{ 
                        color: q.is_correct ? '#28a745' : '#dc3545',
                        marginLeft: '8px',
                        fontWeight: 'bold'
                      }}>
                        {q.is_correct ? '✓' : '✗'}
                      </span>
                    </div>
                    
                    {!q.is_correct && (
                      <div className="review-answer">
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>Correct answer: </span>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#155724',
                          background: 'rgba(40, 167, 69, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}>
                          {decodeHTML(q.options[q.correct_index])}
                        </span>
                        <span style={{ 
                          color: '#28a745',
                          marginLeft: '8px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(!questionHistory || questionHistory.length === 0) && (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
              <p>No questions to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Insights */}
      <div className="glass-card" style={{ 
        marginBottom: '30px',
        background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(68, 160, 141, 0.1))',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          💡 Learning Insights
        </h3>
        <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
          {correctAnswers === totalQuestions && (
            <p style={{ marginBottom: '10px' }}>🌟 Perfect score! You've mastered this topic!</p>
          )}
          {correctAnswers / totalQuestions >= 0.8 && correctAnswers !== totalQuestions && (
            <p style={{ marginBottom: '10px' }}>🎯 Excellent performance! You have strong knowledge in this area.</p>
          )}
          {progress.level === 'hard' && (
            <p style={{ marginBottom: '10px' }}>🚀 You reached the advanced level - great progression!</p>
          )}
          {correctAnswers / totalQuestions < 0.5 && (
            <p style={{ marginBottom: '10px' }}>📚 Consider reviewing the basics and trying again to improve.</p>
          )}
          <p style={{ margin: 0, opacity: 0.9 }}>
            📈 The AI adapted {totalQuestions} questions to match your learning pace.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: '15px', 
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <button
          onClick={onRestart}
          className="btn btn-primary"
          style={{ fontSize: '1.1rem', padding: '15px 30px' }}
        >
          🔄 Try Another Topic
        </button>
        
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ fontSize: '1.1rem', padding: '15px 30px' }}
        >
          📄 Print Results
        </button>
      </div>

      {/* Motivational Footer */}
      <div style={{ 
        textAlign: 'center', 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '1.1rem',
        fontStyle: 'italic'
      }}>
        <p>"Every expert was once a beginner. Keep learning! 🌱"</p>
      </div>
    </div>
  );
}
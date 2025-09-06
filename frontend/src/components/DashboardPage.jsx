import React, { useState, useEffect } from 'react';
import { getHistory } from '../api';

export default function DashboardPage({ userId, onStartQuiz, onViewHistory, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState("Mathematics");
  const [topic, setTopic] = useState("Calculus");
  const [numQuestions, setNumQuestions] = useState(5);

  const courses = [
    { value: "Mathematics", label: "Mathematics", icon: "📐" },
    { value: "Physics", label: "Physics", icon: "⚛️" },
    { value: "Chemistry", label: "Chemistry", icon: "🧪" },
    { value: "Biology", label: "Biology", icon: "🧬" },
    { value: "Computer Science", label: "Computer Science", icon: "💻" },
    { value: "English", label: "English", icon: "📚" },
  ];

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getHistory(userId);
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
      setLoading(false);
    }
    fetchHistory();
  }, [userId]);

  const handleStart = () => {
    onStartQuiz({ course, topic, numQuestions });
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>Welcome, {userId}!</h1>
        <button onClick={onLogout} className="btn btn-secondary">Logout</button>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Start a New Session</h2>
        <div className="form-group">
            <label className="form-label">📚 Choose Your Course</label>
            <select className="form-input" value={course} onChange={(e) => setCourse(e.target.value)}>
                {courses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
            <div className="form-group">
                <label className="form-label">🎯 Enter a Specific Topic</label>
                <input type="text" className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">#️⃣ Questions</label>
                <input type="number" className="form-input" value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)) || 1)} min="1" max="20" />
            </div>
        </div>
        <button onClick={handleStart} className="btn btn-primary btn-full">🚀 Start Learning</button>
      </div>

      <div className="card">
        <h2>Past Sessions</h2>
        {loading ? <p>Loading history...</p> : (
          history.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map((item, index) => (
                <li key={item.session_id} onClick={() => onViewHistory(item)} style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#667eea' }}>{item.course}: {item.topic}</strong>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>{formatDate(item.completed_at)}</div>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Score: {Math.round(item.progress.score)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p>You have no completed sessions yet.</p>
        )}
      </div>
    </div>
  );
}

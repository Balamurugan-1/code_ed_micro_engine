import React, { useState, useEffect } from 'react';
import { getHistory, getAnalytics } from '../api';
import AnalyticsPanel from './AnalyticsPanel';
import ThemeToggle from './ThemeToggle';

const COURSES = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'English', label: 'English' },
];

export default function DashboardPage({ userId, onStartQuiz, onViewHistory, onLogout }) {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState('Mathematics');
  const [topic, setTopic] = useState('Calculus');
  const [numQuestions, setNumQuestions] = useState(5);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hist, stats] = await Promise.all([
          getHistory(userId),
          getAnalytics(userId).catch(() => null),
        ]);
        setHistory(hist);
        setAnalytics(stats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const handleStart = () => onStartQuiz({ course, topic, numQuestions });
  const adjustQ = (delta) => setNumQuestions((n) => Math.min(20, Math.max(1, n + delta)));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const marksFor = (item) => {
    const qh = item.progress?.question_history || [];
    if (qh.length === 0) return 0;
    return Math.round((qh.filter((q) => q.is_correct).length / qh.length) * 100);
  };

  const pillColor = (pct) =>
    pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div className="brand-name">
            Learning Engine
            <span>Adaptive micro-learning</span>
          </div>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <div className="user-chip">
            <div className="avatar">{userId?.[0]?.toUpperCase() || 'U'}</div>
            <span className="uname">{userId}</span>
          </div>
          <button onClick={onLogout} className="btn-ghost" style={{ borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Log out
          </button>
        </div>
      </header>

      <div className="greeting">
        <div className="greeting-title">{greeting}, {userId} 👋</div>
        <div className="greeting-sub">Ready for a focused learning session?</div>
      </div>

      <div className="card" style={{ marginBottom: '26px' }}>
        <div className="section-title"><span className="bar" /> Start a new session</div>

        <div className="form-group">
          <label className="form-label">Course</label>
          <select className="form-input" value={course} onChange={(e) => setCourse(e.target.value)}>
            {COURSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '18px', alignItems: 'start' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Topic</label>
            <input
              type="text"
              className="form-input"
              value={topic}
              placeholder="e.g. Integration, Thermodynamics…"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Questions</label>
            <div className="stepper">
              <button type="button" onClick={() => adjustQ(-1)} aria-label="Fewer questions">−</button>
              <input
                type="number"
                className="form-input"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                min="1" max="20"
                style={{ width: '70px' }}
              />
              <button type="button" onClick={() => adjustQ(1)} aria-label="More questions">+</button>
            </div>
          </div>
        </div>

        <button onClick={handleStart} className="btn btn-primary btn-full" style={{ marginTop: '22px' }}>
          Start learning →
        </button>
      </div>

      <AnalyticsPanel analytics={analytics} />

      <div className="card">
        <div className="section-title"><span className="bar" /> Past sessions</div>
        {loading ? (
          <p className="empty-state">Loading your history…</p>
        ) : history.length > 0 ? (
          history.map((item) => {
            const pct = marksFor(item);
            return (
              <div key={item.session_id} className="session-row" onClick={() => onViewHistory(item)}>
                <div className="session-meta">
                  <strong>{item.course} · {item.topic}</strong>
                  <div className="session-date">{formatDate(item.completed_at)}</div>
                </div>
                <span className="score-pill" style={{ background: pillColor(pct) + '22', color: pillColor(pct) }}>
                  {pct}%
                </span>
              </div>
            );
          })
        ) : (
          <p className="empty-state">No sessions yet — start one above to see your progress here.</p>
        )}
      </div>
    </div>
  );
}

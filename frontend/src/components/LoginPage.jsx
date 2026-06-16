import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';
import ThemeToggle from './ThemeToggle';

const FEATURES = [
  { icon: '🧠', title: 'Adaptive questions', desc: 'Difficulty tunes itself to how you answer.' },
  { icon: '✨', title: 'AI coaching', desc: 'Personalized feedback and study tips after every session.' },
  { icon: '📊', title: 'Track your growth', desc: 'Marks, streaks and weak-skill insights over time.' },
];

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isLogin
        ? await loginUser(userId, password)
        : await registerUser(userId, password);
      // Both endpoints return an access token → log straight in.
      onLogin(res.user_id, res.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-logo">🎓</div>
          <h1>AI Learning Engine</h1>
          <p className="auth-tagline">
            Master any topic with a tutor that adapts to you — one short, focused session at a time.
          </p>
          <div className="auth-features">
            {FEATURES.map((f) => (
              <div className="auth-feature" key={f.title}>
                <span className="auth-feature-icon">{f.icon}</span>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="auth-card">
        <ThemeToggle />
        <div className="auth-tabs" role="tablist">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <h2 className="auth-heading">{isLogin ? 'Welcome back 👋' : 'Create your account'}</h2>
        <p className="auth-sub">
          {isLogin ? 'Log in to continue your learning journey.' : 'Start learning in seconds — no email needed.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <span className="auth-ico">👤</span>
            <input
              type="text"
              className="auth-input"
              placeholder="Student ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="auth-field">
            <span className="auth-ico">🔒</span>
            <input
              type="password"
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
            {isLogin ? 'Register' : 'Log in'}
          </button>
        </p>
      </section>
    </div>
  );
}

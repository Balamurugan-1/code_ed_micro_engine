import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(userId, password);
      } else {
        await registerUser(userId, password);
        alert('Registration successful! Please log in.');
        setIsLogin(true);
      }
      if(isLogin) onLogin(userId);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="start-screen">
      <div className="app-title">
        <h1>🎓 AI Learning Engine</h1>
        <p>Login or register to track your progress</p>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>{isLogin ? 'Student Login' : 'Create Account'}</h2>
          {error && <p style={{ color: '#dc3545', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          <div className="form-group">
            <label className="form-label">👤 Student ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., student123"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">🔑 Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px' }}>
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

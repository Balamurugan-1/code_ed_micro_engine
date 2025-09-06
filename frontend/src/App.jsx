import React, { useState } from "react";
import QuizPage from "./components/QuizPage";
import "./index.css";

export default function App() {
  const [started, setStarted] = useState(false);
  const [userId, setUserId] = useState("user123");
  const [topic, setTopic] = useState("math");

  const topics = [
    { value: "math", label: "Mathematics", icon: "📊" },
    { value: "science", label: "Science", icon: "🧬" },
    { value: "history", label: "History", icon: "📚" },
    { value: "programming", label: "Programming", icon: "💻" },
    { value: "geography", label: "Geography", icon: "🌍" },
  ];

  return (
    <div className="app-container">
      {!started ? (
        <div className="start-screen">
          {/* Header */}
          <div className="app-title">
            <h1>🧠 AI Quiz Engine</h1>
            <p>Personalized micro-learning that adapts to your progress</p>
          </div>

          {/* Main Card */}
          <div className="card">
            {/* User ID Input */}
            <div className="form-group">
              <label className="form-label">👤 Your Learning ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your unique user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            {/* Topic Selection */}
            <div className="form-group">
              <label className="form-label">🎯 Choose Your Learning Topic</label>
              <div className="topic-grid">
                {topics.map((topicOption) => (
                  <div
                    key={topicOption.value}
                    className={`topic-card ${topic === topicOption.value ? 'selected' : ''}`}
                    onClick={() => setTopic(topicOption.value)}
                  >
                    <span className="topic-icon">{topicOption.icon}</span>
                    <div className="topic-label">{topicOption.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Topic Input */}
            <div className="form-group">
              <label className="form-label">✏️ Or enter a custom topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., JavaScript, Biology, World War II"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Start Button */}
            <button
              onClick={() => setStarted(true)}
              disabled={!userId.trim() || !topic.trim()}
              className="btn btn-primary btn-full"
              style={{ fontSize: '1.1rem', padding: '18px 30px' }}
            >
              🚀 Start Your Adaptive Quiz Journey
            </button>
          </div>

          {/* Features */}
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <div className="feature-title">Adaptive Difficulty</div>
              <div className="feature-desc">Questions adjust to your skill level</div>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <div className="feature-title">Micro-Learning</div>
              <div className="feature-desc">Short, focused learning sessions</div>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📈</span>
              <div className="feature-title">Progress Tracking</div>
              <div className="feature-desc">See your improvement over time</div>
            </div>
          </div>
        </div>
      ) : (
        <QuizPage
          userId={userId}
          topic={topic}
          onExit={() => setStarted(false)}
        />
      )}
    </div>
  );
}
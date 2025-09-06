import React, { useState } from "react";
import QuizPage from "./components/QuizPage";
import "./index.css";

export default function App() {
  const [started, setStarted] = useState(false);
  const [userId, setUserId] = useState("student123");
  const [course, setCourse] = useState("Mathematics"); // Default to Mathematics
  const [topic, setTopic] = useState("Calculus"); // Default topic

  const courses = [
    { value: "Mathematics", label: "Mathematics", icon: "📐" },
    { value: "Physics", label: "Physics", icon: "⚛️" },
    { value: "Chemistry", label: "Chemistry", icon: "🧪" },
    { value: "Biology", label: "Biology", icon: "🧬" },
    { value: "Computer Science", label: "Computer Science", icon: "💻" },
    { value: "English", label: "English", icon: "📚" },
  ];

  return (
    <div className="app-container">
      {!started ? (
        <div className="start-screen">
          <div className="app-title">
            <h1>🎓 AI Learning Engine</h1>
            <p>Personalized micro-learning for higher education</p>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">👤 Student ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your unique user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">📚 Choose Your Course</label>
              <div className="topic-grid">
                {courses.map((courseOption) => (
                  <div
                    key={courseOption.value}
                    className={`topic-card ${course === courseOption.value ? 'selected' : ''}`}
                    onClick={() => setCourse(courseOption.value)}
                  >
                    <span className="topic-icon">{courseOption.icon}</span>
                    <div className="topic-label">{courseOption.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">🎯 Enter a Specific Topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Calculus, Kinematics, Organic Reactions"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStarted(true)}
              disabled={!userId.trim() || !course.trim() || !topic.trim()}
              className="btn btn-primary btn-full"
              style={{ fontSize: '1.1rem', padding: '18px 30px' }}
            >
              🚀 Begin Learning Session
            </button>
          </div>

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
              <div className="feature-title">Competency Tracking</div>
              <div className="feature-desc">See your improvement over time</div>
            </div>
          </div>
        </div>
      ) : (
        <QuizPage
          userId={userId}
          course={course}
          topic={topic}
          onExit={() => setStarted(false)}
        />
      )}
    </div>
  );
}

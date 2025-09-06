import React, { useState } from "react";
import QuizPage from "./components/QuizPage";
import "./index.css";

export default function App() {
  const [started, setStarted] = useState(false);
  const [userId, setUserId] = useState("student123");
  const [course, setCourse] = useState("Mathematics");
  const [topic, setTopic] = useState("Calculus");
  const [numQuestions, setNumQuestions] = useState(5); // State for number of questions

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
            {/* Student ID Input */}
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

            {/* Course Selection */}
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

            {/* Topic and Number of Questions Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">🎯 Enter a Specific Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Calculus, Kinematics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">#️⃣ Questions</label>
                <input
                  type="number"
                  className="form-input"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setStarted(true)}
              disabled={!userId.trim() || !course.trim() || !topic.trim() || !numQuestions}
              className="btn btn-primary btn-full"
              style={{ fontSize: '1.1rem', padding: '18px 30px', marginTop: '10px' }}
            >
              🚀 Begin Learning Session
            </button>
          </div>

          {/* Features Grid */}
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
          numQuestions={numQuestions}
          onExit={() => setStarted(false)}
        />
      )}
    </div>
  );
}


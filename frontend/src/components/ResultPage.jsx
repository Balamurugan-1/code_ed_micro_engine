import React, { useState } from "react";
import Latex from "react-latex-next";
import { getCoachFeedback, explainQuestion } from "../api";

// Renders text that may contain **bold** and $...$ / $$...$$ LaTeX.
function RichText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\$\$.*?\$\$|\$.*?\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("$")) {
          return <Latex key={i}>{part}</Latex>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ReviewItem({ q, index }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const decodeHTML = (html) => {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const handleExplain = async () => {
    setLoading(true);
    try {
      const correctText = decodeHTML(q.options[q.correct_index]);
      const text = await explainQuestion(decodeHTML(q.text), correctText);
      setExplanation(text);
    } catch (err) {
      console.error("Failed to explain:", err);
      setExplanation("Couldn't load an explanation right now. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={`review-item ${q.is_correct ? "review-correct" : "review-incorrect"}`}>
      <div className="review-question"><Latex>{`${index + 1}. ${decodeHTML(q.text)}`}</Latex></div>
      <div className="review-answers">
        <div className="review-answer">
          Your answer: <strong><Latex>{decodeHTML(q.options[q.user_answer_index])}</Latex></strong> {q.is_correct ? "✓" : "✗"}
        </div>
        {!q.is_correct && (
          <div className="review-answer">
            Correct answer: <strong><Latex>{decodeHTML(q.options[q.correct_index])}</Latex></strong>
          </div>
        )}
      </div>

      {!explanation && (
        <button className="btn-explain" onClick={handleExplain} disabled={loading}>
          {loading ? "Explaining…" : "🔍 Explain"}
        </button>
      )}
      {explanation && (
        <div className="explain-box">
          <RichText text={explanation} />
        </div>
      )}
    </div>
  );
}

export default function ResultPage({ progress, questionHistory, course, topic, onRestart }) {
  const [coach, setCoach] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  const correctAnswers = questionHistory?.filter((q) => q.is_correct).length || 0;
  const totalQuestions = questionHistory?.length || 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const timed = (questionHistory || []).filter((q) => typeof q.time_taken === "number" && q.time_taken > 0);
  const avgTime = timed.length ? timed.reduce((s, q) => s + q.time_taken, 0) / timed.length : null;

  const skills = (questionHistory || []).reduce((acc, q) => {
    const skill = q.skill || "General Knowledge";
    if (!acc[skill]) acc[skill] = { correct: 0, total: 0 };
    acc[skill].total++;
    if (q.is_correct) acc[skill].correct++;
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

  const handleCoach = async () => {
    setCoachLoading(true);
    try {
      const text = await getCoachFeedback(
        course || "your course",
        topic || "this topic",
        progress?.score || 0,
        questionHistory
      );
      setCoach(text);
    } catch (err) {
      console.error("Failed to get coach feedback:", err);
      setCoach("Couldn't load coaching feedback right now. Please try again.");
    }
    setCoachLoading(false);
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>{performance.emoji}</div>
        <h2 className="results-title">Quiz Completed!</h2>
        <p className="results-subtitle">{performance.message}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "#6366f1" }}>{accuracy}%</div>
          <div className="stat-card-label">Marks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "#10b981" }}>{correctAnswers}/{totalQuestions}</div>
          <div className="stat-card-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "#8b5cf6" }}>{avgTime !== null ? `${avgTime.toFixed(1)}s` : "—"}</div>
          <div className="stat-card-label">Avg Time / Q</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: progress.level === "easy" ? "#10b981" : progress.level === "medium" ? "#f59e0b" : "#ef4444" }}>
            {progress.level}
          </div>
          <div className="stat-card-label">Final Level</div>
        </div>
      </div>

      {/* AI Coach */}
      <div className="coach-card">
        <div className="coach-head">
          <span style={{ fontSize: "1.5rem" }}>✨</span>
          <h3 style={{ margin: 0 }}>AI Coach</h3>
        </div>
        {!coach && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "16px" }}>
            Get a personalized review of your performance and what to study next.
          </p>
        )}
        {coach ? (
          <div className="coach-body"><RichText text={coach} /></div>
        ) : (
          <button className="btn btn-primary" onClick={handleCoach} disabled={coachLoading}>
            {coachLoading ? "Analyzing your session…" : "Get my coaching feedback"}
          </button>
        )}
      </div>

      {skillEntries.length > 0 && (
        <div className="card" style={{ marginBottom: "30px", textAlign: "left" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            🧠 Skill Analysis
          </h3>
          {skillEntries.map(([skill, data]) => {
            const skillAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            const barColor = skillAccuracy >= 75 ? "#10b981" : skillAccuracy >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div key={skill} style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.95rem" }}>
                  <span style={{ fontWeight: "600" }}><Latex>{skill}</Latex></span>
                  <span style={{ color: "#555" }}>{data.correct}/{data.total} ({skillAccuracy}%)</span>
                </div>
                <div className="progress-bar-container" style={{ height: "8px", background: "rgba(0,0,0,0.06)" }}>
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
            <ReviewItem key={index} q={q} index={index} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
        <button onClick={onRestart} className="btn btn-primary" style={{ fontSize: "1.1rem" }}>
          🔄 Try Another Topic
        </button>
      </div>
    </div>
  );
}

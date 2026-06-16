import React from "react";

export default function AnalyticsPanel({ analytics }) {
  if (!analytics || !analytics.summary || analytics.summary.total_sessions === 0) {
    return null;
  }

  const { summary, skills, timeline } = analytics;
  const weakest = skills.slice(0, 5);
  const avgTime = summary.avg_time_per_question;

  return (
    <div className="card" style={{ marginBottom: "26px" }}>
      <div className="section-title"><span className="bar" /> Your learning stats</div>

      <div className="analytics-tiles">
        <Tile value={summary.total_sessions} label="Sessions" />
        <Tile value={`${summary.overall_accuracy}%`} label="Avg Marks" />
        <Tile value={`🔥 ${summary.current_streak}`} label="Day Streak" />
        <Tile value={avgTime ? `${avgTime}s` : "—"} label="Avg Time / Q" />
      </div>

      {weakest.length > 0 && (
        <div style={{ marginTop: "26px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>Skills to focus on</h3>
          {weakest.map((s) => {
            const color = s.accuracy >= 75 ? "#10b981" : s.accuracy >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div key={s.skill} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.92rem" }}>
                  <span style={{ fontWeight: 600 }}>{s.skill}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{s.correct}/{s.total} ({s.accuracy}%)</span>
                </div>
                <div className="progress-bar-container" style={{ height: "8px", background: "rgba(0,0,0,0.06)" }}>
                  <div className="progress-bar" style={{ width: `${s.accuracy}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {timeline.length > 1 && (
        <div style={{ marginTop: "26px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>Marks over time</h3>
          <div className="spark-chart">
            {timeline.map((t, i) => (
              <div key={i} className="spark-col" title={`${t.label} — ${t.accuracy}%`}>
                <div
                  className="spark-bar"
                  style={{ height: `${Math.max(6, t.accuracy)}%` }}
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "6px" }}>
            oldest → newest
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ value, label }) {
  return (
    <div className="analytics-tile">
      <div className="analytics-tile-value">{value}</div>
      <div className="analytics-tile-label">{label}</div>
    </div>
  );
}

/*
  SafetyScore.jsx
  Shows the investment safety score (0-100) with a progress bar
  and a breakdown of what contributed to the score.
*/

export default function SafetyScore({ safetyScore }) {
  return (
    <section className="section" style={{ borderColor: safetyScore.color + "44" }}>
      <h2>Investment Safety Score</h2>
      <div className="safety-row">

        {/* Big score number + verdict */}
        <div className="safety-left">
          <div className="safety-score-big" style={{ color: safetyScore.color }}>
            {safetyScore.score}
            <span className="safety-score-max">/100</span>
          </div>
          <div className="safety-verdict" style={{ color: safetyScore.color }}>
            {safetyScore.verdict}
          </div>
          <div className="safety-risk">{safetyScore.risk}</div>
          <div className="safety-track">
            <div className="safety-fill" style={{ width: `${safetyScore.score}%`, background: safetyScore.color }} />
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="safety-factors">
          {safetyScore.factors.map((f, i) => (
            <div key={i} className="safety-factor">
              <div className="safety-factor-label">{f.label}</div>
              <div className="safety-factor-detail">{f.detail}</div>
              <div className="safety-factor-bar">
                <div className="safety-factor-fill" style={{
                  width:      `${Math.min(100, Math.max(0, (f.impact + 20) / 40 * 100))}%`,
                  background: f.impact >= 0 ? "#22c55e" : "#ef4444",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
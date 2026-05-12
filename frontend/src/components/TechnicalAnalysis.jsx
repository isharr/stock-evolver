/*
  TechnicalAnalysis.jsx
  Shows the plain-English reasons behind the BUY/SELL/HOLD signal
  and a row of key stats (RSI, MA20, MA50, 6-month return).
*/

export default function TechnicalAnalysis({ rec }) {
  return (
    <section className="section">
      <h2>Technical Analysis — Plain English</h2>
      <p className="why-intro">
        Each signal below is one data point. More green = stronger case to buy.
      </p>

      {/* Signal reasons */}
      <div className="reasons">
        {rec.reasons.map((r, i) => (
          <div key={i} className={`reason ${r.good === true ? "good" : r.good === false ? "bad" : "neutral"}`}>
            <span className="reason-icon">
              {r.good === true ? "✅" : r.good === false ? "🔴" : "⚪"}
            </span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      {/* Key stats */}
      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">RSI (14)</div>
          <div className="stat-value" style={{
            color: rec.rsiVal < 30 ? "#22c55e" : rec.rsiVal > 70 ? "#ef4444" : "#e5e5e5"
          }}>
            {rec.rsiVal?.toFixed(1) ?? "N/A"}
          </div>
          <div className="stat-hint">
            {rec.rsiVal < 30 ? "Oversold" : rec.rsiVal > 70 ? "Overbought" : "Neutral"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">20-Day MA</div>
          <div className="stat-value">${rec.ma20?.toFixed(2) ?? "N/A"}</div>
          <div className="stat-hint">Short-term trend</div>
        </div>
        <div className="stat">
          <div className="stat-label">50-Day MA</div>
          <div className="stat-value">${rec.ma50?.toFixed(2) ?? "N/A"}</div>
          <div className="stat-hint">Long-term trend</div>
        </div>
        <div className="stat">
          <div className="stat-label">6-Month Return</div>
          <div className="stat-value" style={{ color: rec.returnPct >= 0 ? "#22c55e" : "#ef4444" }}>
            {rec.returnPct >= 0 ? "+" : ""}{rec.returnPct?.toFixed(1)}%
          </div>
          <div className="stat-hint">Since 6 months ago</div>
        </div>
      </div>
    </section>
  );
}
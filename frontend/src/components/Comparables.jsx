/*
  Comparables.jsx
  Shows valuation multiples vs sector benchmarks.
  Green = stock is favorable on this metric.
  Red   = stock is unfavorable on this metric.
*/

export default function Comparables({ comparables, ticker }) {
  return (
    <section className="section">
      <h2>Valuation Multiples vs Sector</h2>
      <p className="why-intro">
        Comparing {ticker} against S&P 500 tech sector averages.
        Green = favorable vs benchmark, Red = unfavorable.
      </p>

      <div className="comp-grid">
        {comparables.metrics.map((m, i) => {
          const favorable   = m.higherBetter ? m.value > m.benchmark : m.value < m.benchmark;
          const color       = favorable ? "#22c55e" : "#ef4444";
          const displayVal  = m.isPercent ? `${(m.value * 100).toFixed(1)}%` : m.value.toFixed(1) + "x";
          const benchVal    = m.isPercent ? `${(m.benchmark * 100).toFixed(1)}%` : m.benchmark + "x";

          return (
            <div key={i} className="comp-card" style={{
              background:  favorable ? "#041a0a" : "#1a0404",
              borderColor: favorable ? "#0a3a1a" : "#3a0a0a",
            }}>
              <div className="comp-label">{m.label}</div>
              <div className="comp-value" style={{ color }}>{displayVal}</div>
              <div className="comp-benchmark">Sector avg: {benchVal}</div>
              <div className="comp-hint">{m.hint}</div>
              <div style={{ fontSize: "0.7rem", marginTop: "0.4rem" }}>
                {favorable ? "✅ Favorable" : "🔴 Unfavorable"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
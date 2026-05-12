/*
  PriceChart.jsx
  6-month area chart with MA20 and MA50 reference lines.
  Uses Recharts library.
*/

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#a5b4fc", fontWeight: 700 }}>${payload[0].value.toFixed(2)}</div>
    </div>
  );
}

export default function PriceChart({ stockData, rec }) {
  return (
    <section className="section">
      <h2>6-Month Price Chart</h2>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={stockData.days}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#555" }} tickFormatter={d => d.slice(5)} interval={19} />
          <YAxis tick={{ fontSize: 10, fill: "#555" }} domain={["auto","auto"]} tickFormatter={v => `$${v.toFixed(0)}`} />
          <Tooltip content={<CustomTooltip />} />

          <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fill="url(#priceGrad)" dot={false} />

          {/* MA20 line — short-term average */}
          {rec.ma20 && (
            <ReferenceLine y={rec.ma20} stroke="#facc15" strokeDasharray="4 4"
              label={{ value: "MA20", fill: "#facc15", fontSize: 10 }} />
          )}

          {/* MA50 line — longer-term average */}
          {rec.ma50 && (
            <ReferenceLine y={rec.ma50} stroke="#f97316" strokeDasharray="4 4"
              label={{ value: "MA50", fill: "#f97316", fontSize: 10 }} />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <div className="legend">
        <span style={{ color: "#facc15" }}>── MA20 (20-day average)</span>
        <span style={{ color: "#f97316" }}>── MA50 (50-day average)</span>
      </div>
    </section>
  );
}
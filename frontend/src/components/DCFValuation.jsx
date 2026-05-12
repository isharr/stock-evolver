/*
  DCFValuation.jsx
  Shows the DCF valuation results:
    - Key inputs (FCF, WACC, beta, growth rate)
    - 3 scenario cards (bear/base/bull)
    - Bar chart of 5-year FCF projections
*/

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function DCFValuation({ dcf, currentPrice }) {
  return (
    <section className="section">
      <h2>DCF Valuation — Intrinsic Value</h2>
      <p className="why-intro">
        Discounted Cash Flow — same method used by investment banks. 
        We project free cash flow 5 years forward and discount it back using WACC.
        Current price: <strong style={{ color: "#a5b4fc" }}>${currentPrice.toFixed(2)}</strong>
      </p>

      {/* Key inputs grid */}
      <div className="dcf-inputs">
        {[
          { label: "Free Cash Flow",  value: `$${dcf.fcfBillions}B` },
          { label: "WACC",            value: `${dcf.wacc}%` },
          { label: "Beta",            value: dcf.beta },
          { label: "Revenue Growth",  value: `${dcf.revenueGrowth}%` },
          { label: "Net Debt",        value: `$${dcf.netDebtBillions}B` },
          { label: "Cost of Equity",  value: `${dcf.costOfEquity}%` },
        ].map((inp, i) => (
          <div key={i} className="dcf-input">
            <div className="dcf-input-label">{inp.label}</div>
            <div className="dcf-input-value">{inp.value}</div>
          </div>
        ))}
      </div>

      {/* 3 scenario cards */}
      <div className="dcf-scenarios">
        {Object.entries(dcf.results).map(([key, s]) => (
          <div key={key} className="dcf-scenario" style={{ borderColor: s.color }}>
            <div className="dcf-scenario-label" style={{ color: s.color }}>{s.label}</div>
            <div className="dcf-scenario-growth">Growth: {(s.growthRate * 100).toFixed(1)}%/yr</div>
            <div className="dcf-intrinsic" style={{ color: s.color }}>
              ${s.intrinsicValue.toFixed(2)}
            </div>
            <div className="dcf-intrinsic-label">Intrinsic Value</div>
            <div className={`dcf-upside ${s.upside >= 0 ? "up" : "down"}`}>
              {s.upside >= 0 ? "↑" : "↓"} {Math.abs(s.upside).toFixed(1)}%
              {s.upside >= 0 ? " undervalued" : " overvalued"}
            </div>
          </div>
        ))}
      </div>

      {/* 5-year FCF projection chart */}
      <div style={{ marginTop: "1.5rem" }}>
        <div className="dcf-chart-label">5-Year FCF Projections — Base Case ($B)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dcf.results.base.projections} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#555" }} />
            <YAxis tick={{ fontSize: 11, fill: "#555" }} tickFormatter={v => `$${v}B`} />
            <Tooltip
              contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, fontSize: 12 }}
              formatter={(val) => [`$${val}B`, "Projected FCF"]}
            />
            <Bar dataKey="fcf" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="dcf-disclaimer">
        WACC uses CAPM model. All inputs sourced from Yahoo Finance. 
        This is a model — actual results will differ. Not financial advice.
      </p>
    </section>
  );
}
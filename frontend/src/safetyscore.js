/*
  safetyScore.js — Investment Safety Score (0-100)
  
  This combines all three analyses into one number:
    - Technical signals (RSI, moving averages)    → up to ±20 points
    - DCF valuation (intrinsic value vs price)    → up to ±20 points
    - Valuation multiples (vs sector benchmarks)  → up to ±10 points
  
  Starts at 50 (neutral) and adjusts up or down.
  
  Score → Verdict:
    75-100 → Strong Buy  (Low Risk)
    60-74  → Buy         (Moderate-Low Risk)
    45-59  → Hold        (Moderate Risk)
    30-44  → Caution     (Moderate-High Risk)
    0-29   → Avoid       (High Risk)
*/

export function computeSafetyScore(rec, dcf, comparables) {
  let score   = 50; // start neutral
  let factors = [];

  // Factor 1: Technical signals
  // rec.score ranges roughly from -4 to +4
  // We scale it to ±20 points
  if (rec) {
    const techPoints = Math.min(20, Math.max(-20, rec.score * 5));
    score += techPoints;
    factors.push({
      label:  "Technical Signals",
      impact: techPoints,
      detail: `${rec.signal} — RSI ${rec.rsiVal?.toFixed(0) ?? "N/A"}`,
    });
  }

  // Factor 2: DCF valuation
  // Base case upside of +10% → +2 points (capped at ±20)
  if (dcf) {
    const upside    = dcf.results.base.upside;
    const dcfPoints = Math.min(20, Math.max(-20, upside / 5));
    score += dcfPoints;
    factors.push({
      label:  "DCF Valuation",
      impact: dcfPoints,
      detail: `Base case ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% upside vs current price`,
    });
  }

  // Factor 3: Valuation multiples
  // +1 point per favorable metric, -1 per unfavorable (capped at ±10)
  if (comparables) {
    let compScore = 0;
    for (const m of comparables.metrics) {
      const favorable = m.higherBetter ? m.value > m.benchmark : m.value < m.benchmark;
      if (favorable) compScore++;
      else           compScore--;
    }
    const compPoints = Math.min(10, Math.max(-10, compScore * 2));
    score += compPoints;
    factors.push({
      label:  "Valuation Multiples",
      impact: compPoints,
      detail: `${Math.max(0, compScore)} of ${comparables.metrics.length} metrics favorable vs sector`,
    });
  }

  // Clamp to 0-100
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Verdict
  let verdict, color, risk;
  if      (score >= 75) { verdict = "Strong Buy"; color = "#22c55e"; risk = "Low Risk"; }
  else if (score >= 60) { verdict = "Buy";        color = "#86efac"; risk = "Moderate-Low Risk"; }
  else if (score >= 45) { verdict = "Hold";       color = "#facc15"; risk = "Moderate Risk"; }
  else if (score >= 30) { verdict = "Caution";    color = "#f97316"; risk = "Moderate-High Risk"; }
  else                  { verdict = "Avoid";      color = "#ef4444"; risk = "High Risk"; }

  return { score, verdict, color, risk, factors };
}
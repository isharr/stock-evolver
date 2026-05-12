/*
  indicators.js — Technical analysis indicators
  
  What is technical analysis?
  Looking at price patterns to predict future movement.
  Traders use these every day to decide when to buy or sell.
  
  We compute:
    SMA  — Simple Moving Average (average price over N days)
    RSI  — Relative Strength Index (momentum, 0-100)
    
  Then combine them into a recommendation (BUY / SELL / HOLD)
*/

// Simple Moving Average — average closing price over the last N days
// Example: SMA(20) = average of last 20 closing prices
export function sma(closes, window) {
  if (closes.length < window) return null;
  const slice = closes.slice(-window); // take last N items
  return slice.reduce((sum, val) => sum + val, 0) / window;
}

// RSI — Relative Strength Index
// Measures momentum: how fast is price moving up vs down?
// Below 30 = oversold (might bounce up) → good signal
// Above 70 = overbought (might pull back) → bad signal
export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;

  const slice = closes.slice(-(period + 1));
  let gains = 0, losses = 0;

  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains  += diff;
    else          losses -= diff; // make positive
  }

  const avgGain = gains  / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100; // only gains = max RSI

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Combine all signals into a BUY / SELL / HOLD recommendation
// Score system: +1 for bullish signal, -1 for bearish signal
export function computeRecommendation(days) {
  const closes  = days.map(d => d.close);
  const price   = closes[closes.length - 1]; // today's price
  const ma20    = sma(closes, 20);
  const ma50    = sma(closes, 50);
  const rsiVal  = rsi(closes, 14);

  let score   = 0;
  let reasons = [];

  // Signal 1: Is price above the 20-day average? (short-term trend)
  if (ma20 !== null) {
    if (price > ma20) {
      score += 1;
      reasons.push({ good: true,  text: `Price ($${price.toFixed(2)}) is above the 20-day average ($${ma20.toFixed(2)}) — short-term uptrend` });
    } else {
      score -= 1;
      reasons.push({ good: false, text: `Price ($${price.toFixed(2)}) is below the 20-day average ($${ma20.toFixed(2)}) — short-term weakness` });
    }
  }

  // Signal 2: Is price above the 50-day average? (longer-term trend)
  if (ma50 !== null) {
    if (price > ma50) {
      score += 1;
      reasons.push({ good: true,  text: `Price is above the 50-day average ($${ma50.toFixed(2)}) — longer-term strength` });
    } else {
      score -= 1;
      reasons.push({ good: false, text: `Price is below the 50-day average ($${ma50.toFixed(2)}) — longer-term weakness` });
    }
  }

  // Signal 3: Golden cross / Death cross
  // Golden cross = MA20 above MA50 = bullish
  // Death cross  = MA20 below MA50 = bearish
  if (ma20 !== null && ma50 !== null) {
    if (ma20 > ma50) {
      score += 1;
      reasons.push({ good: true,  text: "20-day average is above 50-day average — bullish golden cross signal" });
    } else {
      score -= 1;
      reasons.push({ good: false, text: "20-day average is below 50-day average — bearish death cross signal" });
    }
  }

  // Signal 4: RSI momentum
  if (rsiVal !== null) {
    if (rsiVal < 30) {
      score += 2; // strong signal — worth double
      reasons.push({ good: true,  text: `RSI is ${rsiVal.toFixed(0)} — stock is oversold, potential bounce coming` });
    } else if (rsiVal > 70) {
      score -= 2;
      reasons.push({ good: false, text: `RSI is ${rsiVal.toFixed(0)} — stock is overbought, may pull back soon` });
    } else {
      reasons.push({ good: null,  text: `RSI is ${rsiVal.toFixed(0)} — momentum is neutral` });
    }
  }

  // Signal 5: 6-month price trend
  const returnPct = ((price - closes[0]) / closes[0]) * 100;
  if (returnPct > 10) {
    score += 1;
    reasons.push({ good: true,  text: `Up ${returnPct.toFixed(1)}% over 6 months — strong trend` });
  } else if (returnPct < -10) {
    score -= 1;
    reasons.push({ good: false, text: `Down ${Math.abs(returnPct).toFixed(1)}% over 6 months — weak trend` });
  } else {
    reasons.push({ good: null,  text: `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}% over 6 months — relatively flat` });
  }

  // Convert score to signal
  let signal, label, color;
  if      (score >= 2)   { signal = "BUY";  label = "Strong buy signal";              color = "#22c55e"; }
  else if (score === 1)  { signal = "BUY";  label = "Mild buy signal";                color = "#86efac"; }
  else if (score === 0)  { signal = "HOLD"; label = "Hold — wait for clearer signal"; color = "#facc15"; }
  else if (score === -1) { signal = "SELL"; label = "Mild sell signal";               color = "#fca5a5"; }
  else                   { signal = "SELL"; label = "Strong sell signal";             color = "#ef4444"; }

  return { signal, label, color, score, reasons, rsiVal, ma20, ma50, returnPct };
}
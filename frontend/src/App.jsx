import { useState, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine
} from "recharts";

const API = "http://localhost:8080";
const CORS = "https://api.allorigins.win/raw?url=";


async function fetchYahooData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`;
  const res = await fetch(CORS + encodeURIComponent(url));
  if (!res.ok) throw new Error("Could not fetch data for " + ticker);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No data found for " + ticker);
  const timestamps = result.timestamp;
  const closes  = result.indicators.quote[0].close;
  const opens   = result.indicators.quote[0].open;
  const highs   = result.indicators.quote[0].high;
  const lows    = result.indicators.quote[0].low;
  const volumes = result.indicators.quote[0].volume;
  const meta    = result.meta;
  const days = timestamps.map((ts, i) => ({
    date:       new Date(ts * 1000).toISOString().slice(0, 10),
    open_price: opens[i]   ?? closes[i],
    high:       highs[i]   ?? closes[i],
    low:        lows[i]    ?? closes[i],
    close:      closes[i],
    volume:     volumes[i] ?? 0,
  })).filter(d => d.close != null);
  return { days, meta, ticker: ticker.toUpperCase() };
}

function sma(closes, window) {
  if (closes.length < window) return null;
  const slice = closes.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / window;
}

function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  const slice = closes.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeRecommendation(days) {
  const closes = days.map(d => d.close);
  const price  = closes[closes.length - 1];
  const ma20   = sma(closes, 20);
  const ma50   = sma(closes, 50);
  const rsiVal = rsi(closes, 14);
  let score = 0;
  let reasons = [];

  if (ma20 !== null) {
    if (price > ma20) { score += 1; reasons.push({ good: true,  text: `Price ($${price.toFixed(2)}) is above the 20-day average ($${ma20.toFixed(2)}) — short-term uptrend` }); }
    else              { score -= 1; reasons.push({ good: false, text: `Price ($${price.toFixed(2)}) is below the 20-day average ($${ma20.toFixed(2)}) — short-term weakness` }); }
  }
  if (ma50 !== null) {
    if (price > ma50) { score += 1; reasons.push({ good: true,  text: `Price is above the 50-day average ($${ma50.toFixed(2)}) — longer-term strength` }); }
    else              { score -= 1; reasons.push({ good: false, text: `Price is below the 50-day average ($${ma50.toFixed(2)}) — longer-term weakness` }); }
  }
  if (ma20 !== null && ma50 !== null) {
    if (ma20 > ma50) { score += 1; reasons.push({ good: true,  text: "20-day average is above 50-day average — bullish golden cross signal" }); }
    else             { score -= 1; reasons.push({ good: false, text: "20-day average is below 50-day average — bearish death cross signal" }); }
  }
  if (rsiVal !== null) {
    if (rsiVal < 30)      { score += 2; reasons.push({ good: true,  text: `RSI is ${rsiVal.toFixed(0)} — stock is oversold, potential bounce coming` }); }
    else if (rsiVal > 70) { score -= 2; reasons.push({ good: false, text: `RSI is ${rsiVal.toFixed(0)} — stock is overbought, may pull back soon` }); }
    else                  {             reasons.push({ good: null,  text: `RSI is ${rsiVal.toFixed(0)} — momentum is neutral` }); }
  }
  const firstClose = closes[0];
  const returnPct = ((price - firstClose) / firstClose) * 100;
  if (returnPct > 10)       { score += 1; reasons.push({ good: true,  text: `Up ${returnPct.toFixed(1)}% over 6 months — strong trend` }); }
  else if (returnPct < -10) { score -= 1; reasons.push({ good: false, text: `Down ${Math.abs(returnPct).toFixed(1)}% over 6 months — weak trend` }); }
  else                      {             reasons.push({ good: null,  text: `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}% over 6 months — relatively flat` }); }

  let signal, label, color, emoji;
  if      (score >= 2)  { signal = "BUY";  label = "Strong buy signal";            color = "#22c55e"; emoji = "▲"; }
  else if (score === 1) { signal = "BUY";  label = "Mild buy signal";              color = "#86efac"; emoji = "▲"; }
  else if (score === 0) { signal = "HOLD"; label = "Hold — wait for clearer signal"; color = "#facc15"; emoji = "~"; }
  else if (score === -1){ signal = "SELL"; label = "Mild sell signal";             color = "#fca5a5"; emoji = "▼"; }
  else                  { signal = "SELL"; label = "Strong sell signal";           color = "#ef4444"; emoji = "▼"; }

  return { signal, label, color, emoji, score, reasons, rsiVal, ma20, ma50, returnPct };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#a5b4fc", fontWeight: 700 }}>${payload[0]?.value?.toFixed(2)}</div>
    </div>
  );
}

function buildCsv(days) {
  const header = "date,open,high,low,close,volume";
  const rows = days.map(d => `${d.date},${d.open_price},${d.high},${d.low},${d.close},${d.volume}`);
  return [header, ...rows].join("\n");
}

const POPULAR = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOG"];

export default function App() {
  const [ticker,       setTicker]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [stockData,    setStockData]    = useState(null);
  const [rec,          setRec]          = useState(null);
  const [evolving,     setEvolving]     = useState(false);
  const [evolveResults,setEvolveResults]= useState(null);

  async function search(t) {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;
    setLoading(true); setError(null); setStockData(null); setRec(null); setEvolveResults(null);
    try {
      const data = await fetchYahooData(sym);
      setStockData(data);
      setRec(computeRecommendation(data.days));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runEvolve() {
    if (!stockData) return;
    setEvolving(true);
    try {
      const csv = buildCsv(stockData.days);
      const res = await fetch(`${API}/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, gens: 15, pop: 30, cash: 1000 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvolveResults(data);
    } catch (e) { setError(e.message); }
    finally { setEvolving(false); }
  }

  const price     = stockData?.days[stockData.days.length - 1]?.close;
  const prevPrice = stockData?.days[stockData.days.length - 2]?.close;
  const change    = price && prevPrice ? price - prevPrice : null;
  const changePct = change && prevPrice ? (change / prevPrice) * 100 : null;
  const isUp      = change >= 0;

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>Stock<span>Evolver</span></h1>
          <p>Stock analysis tool. Type any ticker to get a buy/sell recommendation.</p>
        </div>
        <div className="header-badge">OCaml + React</div>
      </header>

      <section className="search-section">
        <div className="search-bar">
          <input
            type="text" placeholder="Enter ticker — AAPL, TSLA, NVDA..."
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <button onClick={() => search()} disabled={loading}>
            {loading ? "Loading…" : "Analyze"}
          </button>
        </div>
        <div className="popular">
          {POPULAR.map(t => (
            <button key={t} className="pill" onClick={() => { setTicker(t); search(t); }}>{t}</button>
          ))}
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      {stockData && rec && (
        <>
          <section className="price-header">
            <div className="price-left">
              <div className="ticker-name">{stockData.ticker}</div>
              <div className="price-big">${price?.toFixed(2)}</div>
              <div className={`change ${isUp ? "up" : "down"}`}>
                {isUp ? "↑" : "↓"} ${Math.abs(change).toFixed(2)} ({isUp ? "+" : ""}{changePct?.toFixed(2)}%) today
              </div>
            </div>
            <div className="signal-right">
              <div className="signal-box" style={{ borderColor: rec.color }}>
                <div className="signal-word" style={{ color: rec.color }}>{rec.signal}</div>
                <div className="signal-label">{rec.label}</div>
              </div>
              <div className="confidence-meter">
                <div className="confidence-label">
                  <span>Confidence</span>
                  <span style={{ color: rec.color }}>{Math.round(Math.min(100, Math.max(0, (rec.score + 4) / 8 * 100)))}%</span>
                </div>
                <div className="confidence-track">
                  <div className="confidence-fill" style={{
                    width: `${Math.min(100, Math.max(0, (rec.score + 4) / 8 * 100))}%`,
                    background: rec.color
                  }} />
                </div>
              </div>
            </div>
          </section>

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
                {rec.ma20 && <ReferenceLine y={rec.ma20} stroke="#facc15" strokeDasharray="4 4" label={{ value: "MA20", fill: "#facc15", fontSize: 10 }} />}
                {rec.ma50 && <ReferenceLine y={rec.ma50} stroke="#f97316" strokeDasharray="4 4" label={{ value: "MA50", fill: "#f97316", fontSize: 10 }} />}
              </AreaChart>
            </ResponsiveContainer>
            <div className="legend">
              <span style={{ color: "#facc15" }}>── MA20 (20-day average)</span>
              <span style={{ color: "#f97316" }}>── MA50 (50-day average)</span>
            </div>
          </section>

          <section className="section">
            <h2>Why {rec.signal}? — Plain English</h2>
            <p className="why-intro">Each signal below is one data point. More green = stronger case to buy.</p>
            <div className="reasons">
              {rec.reasons.map((r, i) => (
                <div key={i} className={`reason ${r.good === true ? "good" : r.good === false ? "bad" : "neutral"}`}>
                  <span className="reason-icon">{r.good === true ? "✅" : r.good === false ? "🔴" : "⚪"}</span>
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
            <div className="stats-row">
              <div className="stat">
                <div className="stat-label">RSI (14)</div>
                <div className="stat-value" style={{ color: rec.rsiVal < 30 ? "#22c55e" : rec.rsiVal > 70 ? "#ef4444" : "#e5e5e5" }}>
                  {rec.rsiVal?.toFixed(1) ?? "N/A"}
                </div>
                <div className="stat-hint">{rec.rsiVal < 30 ? "Oversold" : rec.rsiVal > 70 ? "Overbought" : "Neutral"}</div>
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

          <section className="section">
            <h2>Genetic Algorithm — Best Trading Strategies</h2>
            <p className="why-intro">
              This runs an evolutionary algorithm on 6 months of real {stockData.ticker} data.
              It tests hundreds of trading rules and keeps the ones that made the most money.
            </p>
            <button onClick={runEvolve} disabled={evolving} className="evolve-btn">
              {evolving ? "Evolving… this takes a few seconds" : `Run Evolution on ${stockData.ticker}`}
            </button>
            {evolveResults && (
              <div className="evolve-results">
                <p className="hint">{evolveResults.days_loaded} days · {evolveResults.generations} generations · starting cash $1,000</p>
                {evolveResults.results.map(r => (
                  <div key={r.rank} className="evo-card">
                    <div className="evo-rank">#{r.rank}</div>
                    <div className="evo-rule">{r.rule}</div>
                    <div className={`evo-profit ${r.profit >= 0 ? "up" : "down"}`}>
                      {r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}
                    </div>
                  </div>
                ))}
                <p className="disclaimer">⚠️ Past performance doesn't guarantee future results. Just a Project - not a financial advice.</p>
              </div>
            )}
          </section>
        </>
      )}

      <footer>
        <p>Built with OCaml + Dream + React · Not financial advice ·</p>
      </footer>
    </div>
  );
}
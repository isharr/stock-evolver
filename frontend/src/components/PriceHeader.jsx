/*
  PriceHeader.jsx
  Shows the stock ticker, current price, daily change,
  and the BUY/SELL/HOLD signal with confidence meter.
*/

export default function PriceHeader({ stockData, rec }) {
  const days      = stockData.days;
  const price     = days[days.length - 1].close;
  const prevPrice = days[days.length - 2]?.close;
  const change    = prevPrice ? price - prevPrice : 0;
  const changePct = prevPrice ? (change / prevPrice) * 100 : 0;
  const isUp      = change >= 0;

  // Confidence = how strong the signal is (0-100%)
  const confidence = Math.round(Math.min(100, Math.max(0, (rec.score + 4) / 8 * 100)));

  return (
    <section className="price-header">
      {/* Left: ticker, price, daily change */}
      <div className="price-left">
        <div className="ticker-name">{stockData.ticker}</div>
        <div className="price-big">${price.toFixed(2)}</div>
        <div className={`change ${isUp ? "up" : "down"}`}>
          {isUp ? "↑" : "↓"} ${Math.abs(change).toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%) today
        </div>
      </div>

      {/* Right: signal + confidence bar */}
      <div className="signal-right">
        <div className="signal-box" style={{ borderColor: rec.color }}>
          <div className="signal-word"  style={{ color: rec.color }}>{rec.signal}</div>
          <div className="signal-label">{rec.label}</div>
        </div>
        <div className="confidence-meter">
          <div className="confidence-label">
            <span>Confidence</span>
            <span style={{ color: rec.color }}>{confidence}%</span>
          </div>
          <div className="confidence-track">
            <div className="confidence-fill" style={{ width: `${confidence}%`, background: rec.color }} />
          </div>
        </div>
      </div>
    </section>
  );
}
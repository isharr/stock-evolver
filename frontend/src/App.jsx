/*
  App.jsx — Main component
  
  This is the entry point of the app.
  It coordinates all the data fetching and passes
  data down to each section component.
  
  Flow:
    1. User types a ticker and hits Analyze
    2. We fetch price data + fundamentals in parallel
    3. We compute technicals, DCF, comparables, safety score
    4. We render each section
*/

import { useState } from "react";
import { fetchPriceData, fetchFundamentals, buildCsv } from "./api";
import { computeRecommendation } from "./indicate";
import { computeDCF }            from "./ Dcfs";
import { computeComparables }    from "./comparable";
import { computeSafetyScore }    from "./safetyS";

import PriceHeader       from "./components/PriceHeader";
import SafetyScore       from "./components/SafetyScoree";
import PriceChart        from "./components/PriceChart";
import TechnicalAnalysis from "./components/TechnicalAnalysis";
import DCFValuation      from "./components/DCFValuation";
import Comparables       from "./components/Comparables";
import Evolution         from "./components/Evolution";

const POPULAR = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOG"];

export default function App() {
  // All state lives here and gets passed down as props
  const [ticker,        setTicker]        = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [stockData,     setStockData]     = useState(null);
  const [rec,           setRec]           = useState(null);
  const [dcf,           setDcf]           = useState(null);
  const [comparables,   setComparables]   = useState(null);
  const [safetyScore,   setSafetyScore]   = useState(null);
  const [evolving,      setEvolving]      = useState(false);
  const [evolveResults, setEvolveResults] = useState(null);

  // Main search function — fetches everything and computes all analyses
  async function search(t) {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;

    // Reset all state
    setLoading(true); setError(null);
    setStockData(null); setRec(null); setDcf(null);
    setComparables(null); setSafetyScore(null); setEvolveResults(null);

    try {
      // Fetch price data and fundamentals at the same time (parallel)
      const [priceData, fundData] = await Promise.all([
        fetchPriceData(sym),
        fetchFundamentals(sym),
      ]);

      const price    = priceData.days[priceData.days.length - 1].close;
      const recData  = computeRecommendation(priceData.days);
      const dcfData  = computeDCF(fundData, price);
      const compData = computeComparables(fundData);
      const safety   = computeSafetyScore(recData, dcfData, compData);

      setStockData(priceData);
      setRec(recData);
      setDcf(dcfData);
      setComparables(compData);
      setSafetyScore(safety);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const currentPrice = stockData?.days[stockData.days.length - 1]?.close;

  return (
    <div className="app">

      {/* Header */}
      <header>
        <div className="header-left">
          <h1>Stock<span>Evolver</span></h1>
          <p>Full investment report — technicals, DCF valuation, comparables, genetic algorithm.</p>
        </div>
        <div className="header-badge">OCaml + React</div>
      </header>

      {/* Search bar */}
      <section className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter ticker — AAPL, TSLA, NVDA..."
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <button onClick={() => search()} disabled={loading}>
            {loading ? "Loading…" : "Analyze"}
          </button>
        </div>

        {/* Quick pick pills */}
        <div className="popular">
          {POPULAR.map(t => (
            <button key={t} className="pill" onClick={() => { setTicker(t); search(t); }}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Error message */}
      {error && <div className="error">{error}</div>}

      {/* Results — only show when we have data */}
      {stockData && rec && (
        <>
          <PriceHeader stockData={stockData} rec={rec} />

          {safetyScore && <SafetyScore safetyScore={safetyScore} />}

          <PriceChart stockData={stockData} rec={rec} />

          <TechnicalAnalysis rec={rec} />

          {dcf && <DCFValuation dcf={dcf} currentPrice={currentPrice} />}

          {comparables && comparables.metrics.length > 0 && (
            <Comparables comparables={comparables} ticker={stockData.ticker} />
          )}

          <Evolution
            stockData={stockData}
            buildCsv={buildCsv}
            evolving={evolving}
            setEvolving={setEvolving}
            evolveResults={evolveResults}
            setEvolveResults={setEvolveResults}
            setError={setError}
          />
        </>
      )}

      <footer>
        <p>Built with OCaml + Dream + React · Data from Yahoo Finance · Not financial advice · Educational use only</p>
      </footer>
    </div>
  );
}
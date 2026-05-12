/*
  api.js — All data fetching from Yahoo Finance
  
  We use a CORS proxy (allorigins.win) because browsers block
  direct requests to Yahoo Finance from other websites.
  
  Two functions:
    fetchPriceData(ticker)    → 6 months of daily price data
    fetchFundamentals(ticker) → financial ratios, cash flow, balance sheet
*/

const CORS = "https://api.allorigins.win/raw?url=";

// Fetch 6 months of daily closing prices for a ticker
export async function fetchPriceData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`;
  const res  = await fetch(CORS + encodeURIComponent(url));

  if (!res.ok) throw new Error("Could not fetch data for " + ticker);

  const json   = await res.json();
  const result = json.chart?.result?.[0];
  if (!result)  throw new Error("No data found for " + ticker);

  const { timestamp } = result;
  const { close, open, high, low, volume } = result.indicators.quote[0];

  // Zip all arrays together into a list of day objects
  const days = timestamp
    .map((ts, i) => ({
      date:       new Date(ts * 1000).toISOString().slice(0, 10),
      open_price: open[i]   ?? close[i],
      high:       high[i]   ?? close[i],
      low:        low[i]    ?? close[i],
      close:      close[i],
      volume:     volume[i] ?? 0,
    }))
    .filter(d => d.close != null); // remove any days with missing data

  return { days, ticker: ticker.toUpperCase() };
}

// Fetch financial fundamentals — FCF, P/E, debt, etc.
export async function fetchFundamentals(ticker) {
  const modules = [
    "financialData",          // revenue growth, margins, ratios
    "defaultKeyStatistics",   // P/E, P/B, beta, shares outstanding
    "cashflowStatementHistory", // free cash flow
    "balanceSheetHistory",    // debt, cash
    "summaryDetail",          // trailing P/E, forward P/E
  ].join(",");

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;

  try {
    const res  = await fetch(CORS + encodeURIComponent(url));
    const json = await res.json();
    return json.quoteSummary?.result?.[0] ?? null;
  } catch (e) {
    console.error("Fundamentals fetch failed:", e);
    return null; // return null if it fails — app still works without it
  }
}

// Build a CSV string from price data (used by the OCaml backend)
export function buildCsv(days) {
  const header = "date,open,high,low,close,volume";
  const rows   = days.map(d =>
    `${d.date},${d.open_price},${d.high},${d.low},${d.close},${d.volume}`
  );
  return [header, ...rows].join("\n");
}
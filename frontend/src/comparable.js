/*
  comparables.js — Valuation Multiples vs Sector
  
  What are comparables?
  Instead of projecting cash flows (like DCF), we ask:
  "Is this stock cheap or expensive compared to similar companies?"
  
  We look at ratios like P/E (price to earnings).
  If a stock has P/E of 30x but the sector average is 20x,
  it's trading at a premium — possibly overvalued.
  
  Benchmarks are approximate S&P 500 tech sector averages.
*/

// Each metric: the value, sector benchmark, whether higher is better
const BENCHMARKS = [
  {
    key: "pe",
    label: "P/E Ratio",
    hint: "Price vs earnings. Lower = cheaper vs profits.",
    benchmark: 25,
    higherBetter: false,
    isPercent: false,
    getValue: (fd, ks, sd) => sd?.trailingPE?.raw ?? ks?.trailingPE?.raw,
  },
  {
    key: "fpe",
    label: "Forward P/E",
    hint: "Price vs next year's estimated earnings.",
    benchmark: 22,
    higherBetter: false,
    isPercent: false,
    getValue: (fd, ks, sd) => sd?.forwardPE?.raw ?? ks?.forwardPE?.raw,
  },
  {
    key: "pb",
    label: "P/B Ratio",
    hint: "Price vs book value (assets minus liabilities).",
    benchmark: 4,
    higherBetter: false,
    isPercent: false,
    getValue: (fd, ks) => ks?.priceToBook?.raw,
  },
  {
    key: "ps",
    label: "P/S Ratio",
    hint: "Price vs revenue. Lower = cheaper vs sales.",
    benchmark: 3,
    higherBetter: false,
    isPercent: false,
    getValue: (fd, ks) => ks?.priceToSalesTrailing12Months?.raw,
  },
  {
    key: "eveb",
    label: "EV/EBITDA",
    hint: "Enterprise value vs operating earnings.",
    benchmark: 15,
    higherBetter: false,
    isPercent: false,
    getValue: (fd, ks) => ks?.enterpriseToEbitda?.raw,
  },
  {
    key: "roe",
    label: "ROE",
    hint: "Return on equity — how efficiently profits are generated.",
    benchmark: 0.15,
    higherBetter: true,
    isPercent: true,
    getValue: (fd) => fd?.returnOnEquity?.raw,
  },
  {
    key: "margin",
    label: "Profit Margin",
    hint: "% of revenue kept as profit after all expenses.",
    benchmark: 0.10,
    higherBetter: true,
    isPercent: true,
    getValue: (fd) => fd?.profitMargins?.raw,
  },
  {
    key: "de",
    label: "Debt/Equity",
    hint: "How much debt vs equity. Lower = less leveraged = safer.",
    benchmark: 1.0,
    higherBetter: false,
    isPercent: false,
    getValue: (fd) => fd?.debtToEquity?.raw ? fd.debtToEquity.raw / 100 : null,
  },
];

export function computeComparables(fundamentals) {
  if (!fundamentals) return null;

  const fd = fundamentals.financialData;
  const ks = fundamentals.defaultKeyStatistics;
  const sd = fundamentals.summaryDetail;

  const metrics = BENCHMARKS
    .map(b => ({
      ...b,
      value: b.getValue(fd, ks, sd),
    }))
    .filter(m => m.value !== null && m.value !== undefined);

  return { metrics };
}
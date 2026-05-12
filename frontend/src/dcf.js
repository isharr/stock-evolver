/*
  dcf.js — Discounted Cash Flow Valuation
  
  What is DCF?
  A company is worth the sum of all its future cash flows,
  discounted back to today's value (because $1 today > $1 in 5 years).
  
  Steps:
    1. Get the company's current Free Cash Flow (FCF)
    2. Project it forward 5 years using a growth rate
    3. Calculate the Terminal Value (value after year 5, forever)
    4. Discount everything back using WACC
    5. Divide by shares outstanding = intrinsic value per share
    6. Compare to current price → undervalued or overvalued?
  
  We run 3 scenarios: Bear (pessimistic), Base (realistic), Bull (optimistic)
  
  WACC = Weighted Average Cost of Capital
    This is the discount rate — how much return investors require.
    Calculated using CAPM (Capital Asset Pricing Model):
      Cost of Equity = Risk-Free Rate + Beta × Market Risk Premium
*/

export function computeDCF(fundamentals, currentPrice) {
  if (!fundamentals) return null;

  const fd = fundamentals.financialData;
  const ks = fundamentals.defaultKeyStatistics;
  const cf = fundamentals.cashflowStatementHistory?.cashflowStatements?.[0];
  const bs = fundamentals.balanceSheetHistory?.balanceSheetStatements?.[0];

  // Step 1: Get Free Cash Flow
  const fcf = cf?.freeCashflow?.raw ?? fd?.freeCashflow?.raw ?? null;
  if (!fcf || fcf <= 0) return null; // can't do DCF without positive FCF

  const sharesOutstanding = ks?.sharesOutstanding?.raw ?? null;
  if (!sharesOutstanding)  return null;

  // Step 2: Calculate WACC
  const beta          = ks?.beta?.raw ?? 1.0;  // market sensitivity
  const riskFreeRate  = 0.045;  // 10-year US treasury yield ~4.5%
  const marketPremium = 0.055;  // historical equity risk premium
  const costOfEquity  = riskFreeRate + beta * marketPremium; // CAPM formula

  const totalDebt  = bs?.totalDebt?.raw ?? bs?.longTermDebt?.raw ?? 0;
  const cash       = bs?.cash?.raw ?? bs?.cashAndCashEquivalents?.raw ?? 0;
  const netDebt    = Math.max(0, totalDebt - cash);
  const marketCap  = currentPrice * sharesOutstanding;
  const ev         = marketCap + netDebt; // Enterprise Value
  const debtRatio  = ev > 0 ? netDebt / ev : 0;
  const costOfDebt = 0.04;  // average corporate bond yield
  const taxRate    = 0.21;  // US corporate tax rate

  // WACC formula: weighted average of equity and debt costs
  const wacc = (costOfEquity * (1 - debtRatio)) + (costOfDebt * (1 - taxRate) * debtRatio);

  // Revenue growth rate from Yahoo Finance
  const revenueGrowth = fd?.revenueGrowth?.raw ?? 0.08;

  // Step 3: Run 3 scenarios
  const scenarios = {
    bear: { growthRate: Math.max(revenueGrowth - 0.05, 0.01), terminalGrowth: 0.02, label: "Bear Case", color: "#ef4444" },
    base: { growthRate: revenueGrowth,                         terminalGrowth: 0.03, label: "Base Case", color: "#facc15" },
    bull: { growthRate: revenueGrowth + 0.05,                  terminalGrowth: 0.04, label: "Bull Case", color: "#22c55e" },
  };

  const results = {};

  for (const [key, s] of Object.entries(scenarios)) {
    let projectedFCF = fcf;
    let pvSum        = 0;
    const projections = [];

    // Project FCF for each of 5 years and discount back
    for (let year = 1; year <= 5; year++) {
      projectedFCF *= (1 + s.growthRate);
      const pv      = projectedFCF / Math.pow(1 + wacc, year);
      pvSum        += pv;
      projections.push({
        year: `Y${year}`,
        fcf:  Math.round(projectedFCF / 1e9 * 10) / 10, // in billions
        pv:   Math.round(pv / 1e9 * 10) / 10,
      });
    }

    // Terminal Value = value of all cash flows after year 5
    const terminalFCF   = projectedFCF * (1 + s.terminalGrowth);
    const terminalValue = terminalFCF / (wacc - s.terminalGrowth);
    const pvTerminal    = terminalValue / Math.pow(1 + wacc, 5);

    // Total value = PV of 5 years + PV of terminal value - net debt
    const totalPV        = pvSum + pvTerminal;
    const intrinsicValue = (totalPV - netDebt) / sharesOutstanding;

    results[key] = {
      ...s,
      intrinsicValue,
      upside:      ((intrinsicValue - currentPrice) / currentPrice) * 100,
      projections,
    };
  }

  return {
    results,
    // Key inputs shown to user
    fcfBillions:     (fcf / 1e9).toFixed(1),
    beta:            beta.toFixed(2),
    wacc:            (wacc * 100).toFixed(1),
    costOfEquity:    (costOfEquity * 100).toFixed(1),
    netDebtBillions: (netDebt / 1e9).toFixed(1),
    revenueGrowth:   (revenueGrowth * 100).toFixed(1),
  };
}
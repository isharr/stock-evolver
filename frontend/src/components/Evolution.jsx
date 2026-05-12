/*
  Evolution.jsx
  Runs the OCaml genetic algorithm backend and shows
  the top trading strategies it found.
  
  The backend needs to be running locally on port 8080.
  This is the part we built in OCaml!
*/

const API = "http://localhost:8080";

export default function Evolution({ stockData, buildCsv, evolving, setEvolving, evolveResults, setEvolveResults, setError }) {

  async function runEvolve() {
    setEvolving(true);
    try {
      const csv = buildCsv(stockData.days);
      const res = await fetch(`${API}/evolve`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ csv, gens: 15, pop: 30, cash: 1000 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvolveResults(data);
    } catch (e) {
      setError("Evolution failed — is the OCaml server running on port 8080?");
    } finally {
      setEvolving(false);
    }
  }

  return (
    <section className="section">
      <h2>Genetic Algorithm — Best Trading Strategies</h2>
      <p className="why-intro">
        Evolves hundreds of trading rules on real {stockData.ticker} data
        and finds the ones that made the most money historically.
      </p>

      <button onClick={runEvolve} disabled={evolving} className="evolve-btn">
        {evolving ? "Evolving… this takes a few seconds" : `Run Evolution on ${stockData.ticker}`}
      </button>

      {evolveResults && (
        <div className="evolve-results">
          <p className="hint">
            {evolveResults.days_loaded} days · {evolveResults.generations} generations · starting $1,000
          </p>

          {evolveResults.results.map(r => (
            <div key={r.rank} className="evo-card">
              <div className="evo-rank">#{r.rank}</div>
              <div className="evo-rule">{r.rule}</div>
              <div className={`evo-profit ${r.profit >= 0 ? "up" : "down"}`}>
                {r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}
              </div>
            </div>
          ))}

          <p className="disclaimer">
            ⚠️ Past performance doesn't guarantee future results. Educational use only — not financial advice.
          </p>
        </div>
      )}
    </section>
  );
}
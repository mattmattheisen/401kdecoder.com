'use client';

export default function Results({ data }) {
  if (!data) return null;

  const { meta = {}, fees = {}, holdings = [], allocation = {}, flags = [] } = data;

  return (
    <section style={{ border: '1px solid #333', borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Results</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Metric label="Account Value" value={fmtCurrency(meta.accountValue)} />
        <Metric label="Estimated Annual Cost" value={fmtCurrency(fees.annualCostDollar)} sub={`${fmtPct(fees.totalCostPct)} of assets`} />
        <Metric label="Blended Expense Ratio" value={fmtPct(fees.blendedER)} />
        <Metric label="Admin Fee" value={fmtPct(fees.adminFeePct)} sub={fmtCurrency(fees.adminFeeDollar)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ margin: '12px 0 6px' }}>Flags</h4>
        {flags.length === 0 ? (
          <p style={{ color: '#999' }}>No major issues detected.</p>
        ) : (
          <ul>
            {flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Holding</th>
              <th style={th}>Weight %</th>
              <th style={th}>ER %</th>
              <th style={th}>$ Cost</th>
              <th style={th}>Class</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={i}>
                <td style={td}>{h.name}</td>
                <td style={tdRight}>{num(h.weight)}</td>
                <td style={tdRight}>{num(h.er)}</td>
                <td style={tdRight}>{fmtCurrency(h.costDollar)}</td>
                <td style={tdRight}>{h.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 10, padding: 12 }}>
      <div style={{ color: '#888', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value ?? '—'}</div>
      {sub ? <div style={{ color: '#888', fontSize: 12 }}>{sub}</div> : null}
    </div>
  );
}

const th = { textAlign: 'left', borderBottom: '1px solid #333', padding: '8px 6px' };
const td = { borderBottom: '1px solid #222', padding: '8px 6px' };
const tdRight = { ...td, textAlign: 'right' };

function fmtCurrency(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtPct(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}
function num(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return n.toFixed(2);
}

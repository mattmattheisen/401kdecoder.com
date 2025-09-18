// lib/parseStatement.js
// Heuristic parser for common 401(k)/403(b) statement text.

function classifyFund(name = '', symbol = '') {
  const n = `${name} ${symbol}`.toLowerCase();
  if (/\b(target|retirement)\b/.test(n) && /\d{4}/.test(n)) return 'Target Date';
  if (/\b(s&p|sp|500|total stock|index|russell|mid cap|small cap|extended market)\b/.test(n)) return 'US Stock';
  if (/\b(international|intl|eafe|developed ex|emerging)\b/.test(n)) return 'Intl Stock';
  if (/\b(bond|treasury|aggregate|credit|tips|income)\b/.test(n)) return 'Bonds';
  if (/\b(stable value|money market|cash|capital preservation)\b/.test(n)) return 'Cash';
  if (/\b(reit|real estate|commodit(y|ies)|natural resources)\b/.test(n)) return 'Real Assets';
  return 'Other';
}

function inferER(name = '') {
  const n = name.toLowerCase();
  if (/(index|collective trust|instl idx)/.test(n)) return 0.05;
  if (/(target|retirement)/.test(n)) return 0.35;
  if (/(bond|treasury|aggregate)/.test(n)) return 0.10;
  if (/(growth|value|cap|international|emerging|real estate|reit)/.test(n)) return 0.45;
  if (/(annuity|subaccount|separate account)/.test(n)) return 1.10;
  return 0.40;
}

export function parseStatement(rawText = '') {
  const text = rawText.replace(/\s+/g, ' ').trim();

  // 1) Account value
  const val =
    text.match(/(account|total)\s+(value|balance)[^$]*\$([\d,]+(?:\.\d+)?)/i) ||
    text.match(/\$([\d,]+(?:\.\d+)?)\s+(?:total\s+value|account\s+value)/i);
  const accountValue = val ? Number(val[val.length - 1].replace(/,/g, '')) : 50000;

  // 2) Holdings
  // Try formats like:
  // "Vanguard 500 Index Admiral (VFIAX) 25.00% ER 0.04%" or "... Expense Ratio 0.04%"
  // Also accept lines like: "S&P 500 Index 25.0%"
  const holdings = [];
  const re = /([A-Za-z][A-Za-z0-9&,.\- ]+?)\s*(?:\(([A-Z]{2,6})\))?\s+(\d{1,3}(?:\.\d{1,2})?)%\s*(?:ER|Expense Ratio)?\s*(\d{1,2}(?:\.\d{1,2})?)?%?/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    const symbol = m[2] || '';
    const weight = parseFloat(m[3]);
    const er = m[4] !== undefined ? parseFloat(m[4]) : inferER(name);
    // Filter out obviously bad matches:
    if (weight > 0 && weight <= 100 && name.length > 2) {
      holdings.push({ name, symbol, weight, er, category: classifyFund(name, symbol) });
    }
  }

  // If nothing matched, return a minimal object so UI still renders
  if (holdings.length === 0) {
    return {
      meta: { accountValue },
      fees: { blendedER: 0, adminFeePct: 0, adminFeeDollar: 0, totalCostPct: 0, annualCostDollar: 0 },
      holdings: [],
      allocation: {},
      flags: ['No holdings detected. Try uploading a higher-quality PDF or a text-based statement.']
    };
  }

  // 3) Plan-level/Admin fee (optional)
  const admin =
    text.match(/(recordkeeping|admin|plan|advis(ory|er))\s*fee[^%]*?(\d{1,2}(?:\.\d{1,2})?)%/i);
  const adminFeePct = admin ? parseFloat(admin[3]) : 0.25; // default 0.25%
  const adminFeeDollar = accountValue * (adminFeePct / 100);

  // 4) Aggregate metrics
  const allocation = { 'US Stock': 0, 'Intl Stock': 0, 'Bonds': 0, 'Cash': 0, 'Real Assets': 0, 'Target Date': 0, 'Other': 0 };
  let blendedER = 0;
  holdings.forEach(h => {
    blendedER += (h.er || 0) * (h.weight / 100);
    allocation[h.category] = (allocation[h.category] || 0) + h.weight;
  });

  const totalCostPct = blendedER + adminFeePct;
  const annualCostDollar = accountValue * (totalCostPct / 100);

  // Per-holding cost for the table
  const withCosts = holdings.map(h => ({
    ...h,
    costDollar: ((h.er || 0) / 100) * accountValue * (h.weight / 100)
  }));

  // 5) Flags
  const flags = [];
  const cash = allocation['Cash'] || 0;
  if (cash > 10) flags.push(`High cash balance detected (${cash.toFixed(1)}%).`);
  const pricey = withCosts.filter(h => (h.er || 0) > 0.75).length;
  if (pricey) flags.push(`${pricey} high-fee fund(s) over 0.75% ER.`);
  if ((allocation['Target Date'] || 0) > 50 && withCosts.length > 3) {
    flags.push('Target-date fund overlap with other holdings.');
  }

  return {
    meta: { accountValue },
    fees: { blendedER, adminFeePct, adminFeeDollar, totalCostPct, annualCostDollar },
    holdings: withCosts,
    allocation,
    flags
  };
}

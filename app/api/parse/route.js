// Minimal stub parser so the UI works end-to-end.
import { NextResponse } from 'next/server';

export async function POST() {
  // Return fixed example data so we can test the UI.
  const accountValue = 50000;
  const holdings = [
    { name: 'S&P 500 Index', symbol: 'FXAIX', weight: 50.0, er: 0.02, category: 'US Stock' },
    { name: 'Total Intl Stock', symbol: 'VTIAX', weight: 20.0, er: 0.11, category: 'Intl Stock' },
    { name: 'US Aggregate Bond', symbol: 'AGG', weight: 25.0, er: 0.04, category: 'Bonds' },
    { name: 'Stable Value', symbol: '', weight: 5.0, er: 0.25, category: 'Cash' },
  ];

  const blendedER = holdings.reduce((acc, h) => acc + (h.er || 0) * (h.weight / 100), 0);
  const adminFeePct = 0.25;
  const adminFeeDollar = accountValue * (adminFeePct / 100);
  const totalCostPct = blendedER + adminFeePct;
  const annualCostDollar = accountValue * (totalCostPct / 100);

  const allocation = holdings.reduce((acc, h) => {
    acc[h.category] = (acc[h.category] || 0) + h.weight;
    return acc;
  }, {});

  // add per-holding dollar cost for the simple table
  const withCosts = holdings.map(h => ({
    ...h,
    costDollar: ((h.er || 0) / 100) * accountValue * (h.weight / 100),
  }));

  const flags = [];
  if ((allocation['Cash'] || 0) > 10) flags.push('High cash balance.');
  if (withCosts.some(h => (h.er || 0) > 0.75)) flags.push('High-fee fund detected.');

  return NextResponse.json({
    meta: { accountValue },
    fees: { blendedER, adminFeePct, adminFeeDollar, totalCostPct, annualCostDollar },
    holdings: withCosts,
    allocation,
    flags
  });
}

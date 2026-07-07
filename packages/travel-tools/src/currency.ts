/**
 * Currency conversion for the budget sections — ECB reference rates
 * via frankfurter.dev (free, no key, no auth). Fetched server-side
 * with a 24h revalidate so an entire day of traffic across all four
 * brands costs ONE upstream request per lambda region.
 *
 * Failure mode is silent: rates=null → the page renders USD only.
 * Never let a third-party rate API break a destination page.
 */

export interface DisplayCurrency {
  code: string;
  /** Prefix symbol used in the compact "≈ €118 · £102" strip. */
  symbol: string;
}

/** ECB-covered majors that match the sites' actual visitor mix. */
export const DISPLAY_CURRENCIES: readonly DisplayCurrency[] = [
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
];

export type UsdRates = Readonly<Record<string, number>>;

const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${DISPLAY_CURRENCIES.map((c) => c.code).join(',')}`;

/** USD→X rates, cached 24h by Next's fetch cache. Null on any failure. */
export async function getUsdRates(): Promise<UsdRates | null> {
  try {
    const res = await fetch(RATES_URL, {
      next: { revalidate: 86_400 },
    } as RequestInit & { next: { revalidate: number } });
    if (!res.ok) return null;
    const body = (await res.json()) as { rates?: Record<string, number> };
    if (!body.rates || Object.keys(body.rates).length === 0) return null;
    return body.rates;
  } catch {
    return null;
  }
}

/**
 * "≈ €118 · £102 · ₹10,950" for a USD amount. Amounts are daily
 * budgets, not invoices — round to clean numbers (2 significant-ish
 * digits above 100) so the strip reads like travel advice, not a
 * currency terminal.
 */
export function formatConvertedStrip(usd: number, rates: UsdRates): string {
  const parts: string[] = [];
  for (const cur of DISPLAY_CURRENCIES) {
    const rate = rates[cur.code];
    if (!rate || !Number.isFinite(rate)) continue;
    parts.push(`${cur.symbol}${roundBudget(usd * rate).toLocaleString('en-US')}`);
  }
  return parts.length > 0 ? `≈ ${parts.join(' · ')}` : '';
}

function roundBudget(value: number): number {
  if (value >= 10_000) return Math.round(value / 500) * 500;
  if (value >= 1_000) return Math.round(value / 50) * 50;
  if (value >= 100) return Math.round(value / 5) * 5;
  return Math.round(value);
}

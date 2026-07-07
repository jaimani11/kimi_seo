import { formatConvertedStrip, type UsdRates } from '@adored/travel-tools';

/**
 * Converted daily-budget lines under the USD budget grid — "$130/day
 * ≈ €112 · £96 · ₹11,550 · A$196 · C$178". Rates arrive from the
 * page's server fetch (24h-cached ECB reference rates); when the
 * fetch failed the component renders nothing and the page stays
 * USD-only.
 */
export function CurrencyStrip({
  tiers,
  rates,
}: {
  tiers: ReadonlyArray<{ label: string; usd: number }>;
  rates: UsdRates | null;
}) {
  if (!rates) return null;
  const rows = tiers
    .map((t) => ({ ...t, strip: formatConvertedStrip(t.usd, rates) }))
    .filter((t) => t.strip.length > 0);
  if (rows.length === 0) return null;

  return (
    <div
      style={{
        margin: '0 0 1.1rem',
        padding: '0.85rem 1.1rem',
        borderRadius: '0.85rem',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
        {rows.map((t) => (
          <li
            key={t.label}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: 'var(--ink-secondary)',
            }}
          >
            <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>
              {t.label} ${t.usd}/day
            </strong>{' '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.strip}</span>
          </li>
        ))}
      </ul>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          color: 'var(--ink-tertiary)',
          margin: '0.5rem 0 0',
        }}
      >
        Converted at ECB reference rates, refreshed daily.
      </p>
    </div>
  );
}

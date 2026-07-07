/**
 * Server-rendered "how far on foot" list that pairs with the
 * client-side DestinationMap — this is the crawlable text version of
 * the pins ("La Malagueta — 11 min walk from center"), so the SEO
 * value of the walking-distance content never depends on JS.
 */
export function WalkDistances({
  items,
}: {
  items: ReadonlyArray<{
    name: string;
    kind: 'attraction' | 'neighborhood';
    /** Precomputed phrasing, e.g. "14 min walk from center". */
    label: string;
  }>;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: '1.1rem 0 0',
        display: 'grid',
        gap: '0.5rem',
      }}
    >
      {items.map((item) => (
        <li
          key={`${item.kind}-${item.name}`}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            color: 'var(--ink-secondary)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: '0.5rem',
          }}
        >
          <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{item.name}</strong>
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: item.kind === 'attraction' ? '#d97706' : '#2563eb',
            }}
          >
            {item.kind}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

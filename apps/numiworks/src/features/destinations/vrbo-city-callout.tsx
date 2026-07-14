import type { SeoCity } from '@lib/seo/cities';
import { buildVrboSearchUrl } from '@lib/affiliate/vrbo-link';

/**
 * VRBO whole-home callout — sits below the destination hero, offering VRBO
 * whole-home rentals for the destination as a secondary CTA. Deep-links to a
 * TRACKED, destination-specific VRBO search for the city (Partnerize camref /
 * template, via buildVrboSearchUrl) — never a destination-less homepage bounce.
 *
 * Fails closed: when VRBO is unconfigured the callout is hidden rather than
 * sending the visitor to an untracked VRBO homepage.
 */

export function VrboCityCallout({ city }: { city: SeoCity }) {
  const href = buildVrboSearchUrl(city.name);
  if (!href) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 pt-6 md:pt-10">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:border-[color:var(--accent-primary)]"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
          textDecoration: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#0079C1',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Whole homes · Vacation rentals on VRBO
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              fontWeight: 700,
              lineHeight: 1.35,
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Prefer a full kitchen and more space than a hotel in {city.name}?
          </p>
          <p
            className="mt-0.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.82rem',
              lineHeight: 1.45,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            Browse VRBO cabins, villas and apartments (Expedia Group brand).
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#0079C1',
            whiteSpace: 'nowrap',
          }}
        >
          See on VRBO →
        </span>
      </a>
    </section>
  );
}

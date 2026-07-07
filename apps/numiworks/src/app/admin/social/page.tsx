import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { SEO_CITIES, citiesByRegion } from '@lib/seo/cities';
import { hasDestinationGuide } from '@lib/seo/destination-content';

export const metadata: Metadata = {
  title: 'Social content · Admin · numiworks',
};

/**
 * Admin index: list cities, group by region, link to the per-city
 * social-content view. Cities with a hand-curated sample pack are
 * flagged so we know which ones ship "demo" content without the
 * Anthropic key.
 */
export default async function AdminSocialPage() {
  await requireAdmin();

  const grouped = citiesByRegion();
  const samplePacks = new Set(['tokyo']);
  const guideCount = SEO_CITIES.filter((c) => hasDestinationGuide(c.slug)).length;

  return (
    <AdminShell
      section="social"
      title="Social content"
      subtitle={`${SEO_CITIES.length} cities · ${guideCount} with rich guides · ${samplePacks.size} with hand-curated sample packs`}
    >
      <div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            margin: 0,
          }}
        >
          How this works
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: 0,
            maxWidth: '46rem',
          }}
        >
          Each city ships <strong>10 Pinterest pins + 10 TikTok + 10 Reels + 10 Shorts scripts</strong>{' '}
          (40 items total). Generation modes, in priority order: (1) hand-curated sample pack
          if available, (2) Anthropic-backed LLM if{' '}
          <code style={{ fontFamily: 'var(--font-geist-mono)' }}>ANTHROPIC_API_KEY</code> is set,
          (3) deterministic template fallback that pulls from the destination guide content.
          Every city always renders — no spinner ever stalls.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((region) => {
          const cities = grouped[region];
          if (cities.length === 0) return null;
          return (
            <section key={region}>
              <h3
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                  marginBottom: '0.8rem',
                }}
              >
                {region}
              </h3>
              <ul
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {cities.map((c) => {
                  const hasSample = samplePacks.has(c.slug);
                  const hasGuide = hasDestinationGuide(c.slug);
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`/admin/social/${c.slug}`}
                        className="block rounded-lg border p-3 transition-colors hover:border-[color:var(--accent-primary)]"
                        style={{
                          background: 'var(--surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          textDecoration: 'none',
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              color: 'var(--ink-primary)',
                              margin: 0,
                            }}
                          >
                            {c.name}
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.7rem',
                              color: 'var(--ink-tertiary)',
                              margin: 0,
                            }}
                          >
                            {c.countryName}
                          </p>
                        </div>
                        <div
                          className="mt-2 flex flex-wrap gap-1"
                          style={{ fontSize: '0.65rem' }}
                        >
                          {hasSample ? (
                            <Tag tone="positive">sample</Tag>
                          ) : (
                            <Tag tone="neutral">generated</Tag>
                          )}
                          {hasGuide ? <Tag tone="positive">rich guide</Tag> : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'positive' | 'neutral';
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.62rem',
        letterSpacing: '0.05em',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        color:
          tone === 'positive' ? 'var(--accent-primary)' : 'var(--ink-tertiary)',
        background:
          tone === 'positive'
            ? 'var(--accent-primary-soft)'
            : 'var(--surface-raised)',
        border:
          tone === 'positive'
            ? '1px solid var(--accent-primary-soft)'
            : '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </span>
  );
}

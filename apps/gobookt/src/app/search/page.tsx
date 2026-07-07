import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { viatorProviderFromEnv } from '@/providers/viator';
import { ExperienceCardStandard } from '@/features/experience-cards';
import type { Experience } from '@core/experience';
import { SearchBar } from '@/features/site/search-bar';
import { ConciergeNote } from '@/features/site/concierge-note';
import { ViewBeacon } from '@/features/analytics/view-beacon';

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ q?: string; limit?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  // Every query-string variant is noindex — protects the strong
  // themed + destination pages from being diluted by low-quality
  // search-result URLs at scale.
  const robots = { index: false, follow: false } as const;
  if (!q) return { title: 'Search · gobookt', robots };
  return {
    title: `${q} · search · gobookt`,
    description: `Bookable experiences matching "${q}".`,
    robots,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const limit = clampInt(parseInt(params.limit ?? '', 10), 4, 36, 24);

  const result = await runSearch(q, limit);

  return (
    <>
      {q.length > 0 ? <ViewBeacon event="search_results_view" refValue={q} /> : null}
      <SiteHeader />

      {/* Search bar band */}
      <section
        className="w-full"
        style={{
          background: 'var(--surface-base)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
          <SearchBar initialQuery={q} />
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {q.length === 0 ? (
          <EmptyState message="Type a city, an activity, or a vibe above to see real experiences." />
        ) : result.error ? (
          <EmptyState
            heading="Search paused"
            message="We couldn't reach our travel partner for a moment. Try again in a few seconds."
          />
        ) : result.experiences.length === 0 ? (
          <EmptyState
            heading={`Nothing for "${q}" yet.`}
            message="Try a broader term (e.g. the city name) or one of the suggested searches on the homepage."
          />
        ) : (
          <>
            <ConciergeNote query={q} />
            <header className="mb-8 flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Live · {result.experiences.length} results
                </p>
                <h1
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
                    fontWeight: 400,
                    color: 'var(--ink-primary)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.15,
                    margin: 0,
                  }}
                >
                  Bookable for <em style={{ fontStyle: 'italic' }}>&ldquo;{q}&rdquo;</em>.
                </h1>
              </div>
              <Link
                href="/"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                  textDecoration: 'none',
                }}
              >
                Browse all
              </Link>
            </header>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.experiences.map((e) => (
                <ExperienceCardStandard key={e.id} experience={e} dense />
              ))}
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </>
  );
}

interface SearchResult {
  experiences: Experience[];
  error: string | null;
}

async function runSearch(q: string, limit: number): Promise<SearchResult> {
  if (q.length === 0) return { experiences: [], error: null };
  const provider = viatorProviderFromEnv();
  if (!provider) return { experiences: [], error: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), 12_000);
  try {
    const result = await provider.search(
      { searchTerm: q, limit },
      { signal: controller.signal, secrets: {} },
    );
    return { experiences: [...result.experiences], error: null };
  } catch (err) {
    return {
      experiences: [],
      error: err instanceof Error ? err.message : 'unknown',
    };
  } finally {
    clearTimeout(timer);
  }
}

function EmptyState({
  heading,
  message,
}: {
  heading?: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-20 text-center">
      {heading ? (
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {heading}
        </h2>
      ) : null}
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1rem',
          lineHeight: 1.55,
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}

function clampInt(n: number, lo: number, hi: number, fallback: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

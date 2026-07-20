import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { PlanForm } from '@/features/plan/plan-form';
import { Breadcrumbs } from '@/features/seo/breadcrumbs';
import { buildPlan, type Plan, type PlanDay } from './build-plan';
import { canonicalUrl } from '@lib/site/origin';

/**
 * /plan — AI itinerary planner, Expedia-powered.
 *
 *   - No query params: the destination / days / vibe form.
 *   - With `?d=…&n=…&v=…`: server-side, Claude builds a day-by-day itinerary
 *     (deterministic fallback if the AI is unavailable — never errors), and the
 *     whole trip hands off to gotript's TRACKED Expedia search.
 *
 * The base /plan is indexable; the generated `?d=…` result pages are noindexed
 * (personalized tool output, not editorial to rank).
 */

export const revalidate = 300;

interface SearchParams {
  d?: string;
  n?: string;
  v?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { d, n } = await searchParams;
  if (!d) {
    return {
      title: 'Plan a trip · AI itinerary builder',
      description:
        'Describe a trip in one sentence — destination, days, vibe — and get an AI-built day-by-day itinerary. Book every piece on Expedia in one flow.',
      alternates: { canonical: canonicalUrl('/plan') },
    };
  }
  const nights = parseNights(n);
  const title = `${nights} ${nights === 1 ? 'day' : 'days'} in ${d.trim()} · AI trip plan`;
  return {
    title,
    description: `An AI-built ${nights}-day itinerary for ${d.trim()} — day-by-day, book it on Expedia.`,
    alternates: { canonical: canonicalUrl('/plan') },
    robots: { index: false, follow: true },
  };
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const destination = (params.d ?? '').trim();

  let plan: Plan | null = null;
  if (destination) {
    plan = await buildPlan({
      destination,
      nights: parseNights(params.n),
      vibeTags: parseVibe(params.v),
    });
  }

  return (
    <>
      <SiteHeader />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Plan a trip', href: plan ? '/plan' : undefined },
          ...(plan ? [{ label: `${plan.nights}d ${plan.destination}` }] : []),
        ]}
      />

      <section
        className="mx-auto max-w-4xl px-6 pt-6 pb-14 md:pt-10"
        style={{ background: 'var(--surface-base)' }}
      >
        <header className="mx-auto max-w-3xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              margin: 0,
            }}
          >
            AI itinerary builder · Expedia-powered
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {plan ? plan.destination : 'Plan a trip in one sentence,'}
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              {plan
                ? `${plan.nights} ${plan.nights === 1 ? 'day' : 'days'}, planned end to end.`
                : 'book it end to end.'}
            </em>
          </h1>
          {plan?.summary ? (
            <p
              className="mx-auto mt-4 max-w-xl"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.05rem',
                lineHeight: 1.55,
                color: 'var(--ink-secondary)',
                margin: '1rem auto 0',
              }}
            >
              {plan.summary}
            </p>
          ) : null}
        </header>

        <div className="mt-10">
          <PlanForm
            initialDestination={destination}
            initialNights={parseNights(params.n)}
            initialVibe={parseVibe(params.v)}
          />
        </div>

        {plan ? (
          <div className="mt-12 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CtaLink href={plan.thingsToDoHref} label={`Book things to do in ${plan.destination}`} primary />
              <CtaLink href={plan.staysHref} label={`Find your ${plan.destination} stay`} />
            </div>

            <div className="flex flex-col gap-5">
              {plan.days.map((day) => (
                <DayCard key={day.day} day={day} />
              ))}
            </div>

            <p
              className="mt-1 text-center"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.72rem',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              Itinerary is a starting point; book each piece on Expedia — same price as direct,
              commission keeps the site free.
            </p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </>
  );
}

function DayCard({ day }: { day: PlanDay }) {
  return (
    <div
      className="rounded-2xl border p-5 md:p-6"
      style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-baseline gap-3">
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          Day {day.day}
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.3rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          {day.title}
        </h2>
      </div>
      <ul className="mt-4 flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {day.items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span
              style={{
                flex: '0 0 5.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
                paddingTop: '0.15rem',
              }}
            >
              {it.time}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  color: 'var(--ink-primary)',
                }}
              >
                {it.activity}
              </span>
              {it.why ? (
                <span
                  className="mt-0.5 block"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    lineHeight: 1.45,
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  {it.why}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaLink({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 transition-transform hover:translate-y-[-1px]"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.9rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        textDecoration: 'none',
        background: primary ? 'var(--accent-primary)' : 'var(--surface-elevated)',
        color: primary ? '#1a1a1a' : 'var(--ink-primary)',
        border: `1px solid ${primary ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
      }}
    >
      {label} →
    </a>
  );
}

function parseNights(raw: string | undefined): number {
  if (!raw) return 4;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 4;
  return Math.max(1, Math.min(7, n));
}

function parseVibe(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 24)
    .slice(0, 6);
}

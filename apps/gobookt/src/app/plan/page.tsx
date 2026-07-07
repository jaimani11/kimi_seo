import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { PlanForm } from '@/features/plan/plan-form';
import { PlanDayCard } from '@/features/plan/plan-day-card';
import { ReserveAllButton } from '@/features/plan/reserve-all-button';
import { Breadcrumbs } from '@/features/seo/breadcrumbs';
import { buildPlan } from './build-plan';
import type { Plan } from '@lib/plan/types';
import { canonicalUrl } from '@lib/site/origin';

/**
 * /plan — agentic itinerary builder.
 *
 *   - No query params: render the destination/days/vibe form.
 *   - With `?d=…&n=…&v=…`: server-side build a multi-day Viator plan
 *     with theme-driven inventory and per-slot reasoning, plus a
 *     "Reserve all" CTA that opens each /r/[id] redirect in sequence.
 *
 * Shareable, indexable. URL fully describes the plan.
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
      title: 'Plan a trip · Viator-powered itinerary builder',
      description:
        'Describe a trip in one sentence — destination, days, vibe — and the AI concierge builds a day-by-day plan from live Booking.com inventory. Reserve every experience in one flow.',
      alternates: { canonical: canonicalUrl('/plan') },
    };
  }
  const nights = parseNights(n);
  const title = `${nights} ${nights === 1 ? 'day' : 'days'} in ${d.trim()} · Plan with Viator`;
  return {
    title,
    description: `An AI-built ${nights}-day itinerary for ${d.trim()} — live Viator experiences, smart sequencing, reserve every slot in one flow.`,
    alternates: { canonical: canonicalUrl('/plan') },
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
  let error: string | null = null;

  if (destination) {
    try {
      plan = await buildPlan({
        destination,
        nights: parseNights(params.n),
        vibeTags: parseVibe(params.v),
      });
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const totalPicks = plan?.days.flatMap((d) => d.slots.flatMap((s) => s.picks)).length ?? 0;

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
        className="mx-auto max-w-6xl px-6 pt-6 pb-12 md:pt-10"
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
            AI Itinerary builder · Viator-powered
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
            {plan
              ? plan.destination
              : 'Plan a trip in one sentence,'}
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              {plan ? `${plan.nights} ${plan.nights === 1 ? 'day' : 'days'}, planned end to end.` : 'reserve it end to end.'}
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

        {error ? (
          <p
            className="mx-auto mt-8 max-w-3xl rounded-xl border px-5 py-4 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              color: 'var(--ink-secondary)',
              borderColor: 'var(--border-subtle)',
              background: 'var(--surface-elevated)',
            }}
          >
            We couldn&rsquo;t build the plan right now — Viator inventory is temporarily
            unavailable. Try again in a moment.
          </p>
        ) : null}

        {plan ? (
          <div className="mt-12 flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                {totalPicks} live Viator experiences · day-by-day
              </p>
              <ReserveAllButton totalPicks={totalPicks} />
            </div>

            <div className="flex flex-col gap-6">
              {plan.days.map((day) => (
                <PlanDayCard key={day.dayNumber} day={day} />
              ))}
            </div>

            <p
              className="mt-2 text-center"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              Affiliate links to Viator — same price as direct, commission keeps the site free.
            </p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </>
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

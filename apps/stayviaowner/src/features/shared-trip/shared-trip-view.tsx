'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, ExternalLink, Sparkle } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';
import type { TripIntent } from '@core/trip-intent';
import type { TripProposal } from '@core/trip-proposal';
import type { ProposalRef } from '@core/partial';

/**
 * Read-only render of a shared trip. Lives at /t/[slug]. Two CTAs:
 *
 *   - "Save to my StayScout" → POSTs to /api/trips/save with the
 *     proposal+intent+proposalRef. The recipient becomes the owner of
 *     a fresh row (anonymous or authenticated). Idempotent.
 *
 *   - "Try this prompt myself" → /?prompt=<urlencoded>. Workspace
 *     pre-fills the input bar with the original raw prompt.
 *
 * Note: rawInput on the shared intent is masked server-side (privacy).
 * The "Try" CTA falls back to a friendly composed prompt built from
 * structured intent when rawInput is empty.
 */

interface SharedTripViewProps {
  slug: string;
  proposal: TripProposal;
  intent: TripIntent;
  proposalSummary: ProposalRef['summary'];
  bookmarkedAt: string;
}

export function SharedTripView({
  slug,
  proposal,
  intent,
  proposalSummary,
  bookmarkedAt,
}: SharedTripViewProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  async function handleSave() {
    setSaving(true);
    track('save_click', { ref: slug });
    try {
      const proposalRef: ProposalRef = {
        turnId: `shared_${slug}`,
        proposalId: proposal.generatedAt + '_' + slug, // fresh stable id per recipient
        generatedAt: proposal.generatedAt,
        summary: proposalSummary,
      };
      const res = await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal, intent, proposalRef }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaveStatus('saved');
      // Land them in the workspace with the saved-trips panel open by
      // default. The hash is consumed client-side by Workspace.
      setTimeout(() => router.push('/#saved'), 600);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function reconstructPromptFromIntent(): string {
    const dest = intent.destinations[0]?.name ?? '';
    const nights = intent.duration.nights;
    const groupKind = intent.travelers.groupKind ?? '';
    const tags = intent.vibe.tags?.slice(0, 2).join(', ') ?? '';
    return [dest, `${nights} days`, groupKind, tags].filter(Boolean).join(', ');
  }

  const prefillPrompt = intent.rawInput || reconstructPromptFromIntent();
  const tryUrl = `/?prompt=${encodeURIComponent(prefillPrompt)}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Shared trip · {proposalSummary.destinationName}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {proposalSummary.heroStayName}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {proposal.reasoning.summary}
        </p>
      </header>

      <HeroBlock proposal={proposal} />

      {proposal.alternatives.length > 0 ? (
        <section>
          <h2
            className="mb-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Alternatives
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {proposal.alternatives.slice(0, 4).map((alt) => (
              <AlternativeBlock key={alt.id} stay={alt} />
            ))}
          </div>
        </section>
      ) : null}

      {proposal.reasoning.highlights.length > 0 ? (
        <section
          className="rounded-[14px] border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h2
            className="mb-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Why this trip
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {proposal.reasoning.highlights.map((h, i) => (
              <li
                key={`${h.label}-${i}`}
                className="rounded-full border px-2 py-0.5"
                style={{
                  background: 'var(--surface-overlay)',
                  borderColor: 'var(--border-subtle)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  color: 'var(--ink-secondary)',
                }}
              >
                {h.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saveStatus === 'saved'}
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-70"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body)',
            fontWeight: 500,
          }}
        >
          {saveStatus === 'saved' ? (
            <>
              <Sparkle width={14} />
              Saved to your StayScout
            </>
          ) : (
            <>
              <Bookmark size={14} strokeWidth={1.8} />
              {saving ? 'Saving…' : 'Save to my StayScout'}
            </>
          )}
        </button>

        {saveStatus !== 'saved' ? (
          <a
            href={tryUrl}
            className="flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 transition-colors hover:bg-[color:var(--surface-overlay)]"
            style={{
              borderColor: 'var(--border-emphasis)',
              color: 'var(--ink-primary)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 500,
            }}
          >
            Try this prompt myself
            <ExternalLink size={14} strokeWidth={1.8} />
          </a>
        ) : null}

        {saveStatus === 'error' ? (
          <p
            className="text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--accent-warning)',
            }}
          >
            Couldn&apos;t save. Try again in a moment.
          </p>
        ) : null}
      </div>

      <footer className="pt-4">
        <p
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.625rem',
            letterSpacing: '0.04em',
            color: 'var(--ink-tertiary)',
          }}
        >
          Shared on{' '}
          {new Date(bookmarkedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          · stayscout
        </p>
      </footer>
    </div>
  );
}

function HeroBlock({ proposal }: { proposal: TripProposal }) {
  const stay = proposal.hero;
  return (
    <article
      className="flex flex-col gap-4 rounded-[18px] border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-emphasis)',
      }}
    >
      {stay.photos[0] ? (
        <div
          className="relative w-full overflow-hidden rounded-[14px]"
          style={{ aspectRatio: '16/9' }}
        >
          <Image
            src={stay.photos[0].url}
            alt={stay.photos[0].alt}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          {stay.location.region ?? stay.location.country}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-sm)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {stay.name}
        </h3>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body)',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.5,
            color: 'var(--ink-secondary)',
          }}
        >
          {stay.description}
        </p>
      </div>
      <div
        className="flex items-center justify-between gap-3 border-t pt-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-body-lg)',
            color: 'var(--accent-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {stay.pricing.pricePerNight.amount.toLocaleString()} {stay.pricing.pricePerNight.currency}
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--ink-tertiary)',
              marginLeft: '0.25rem',
            }}
          >
            / night
          </span>
        </p>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-secondary)',
          }}
        >
          Sleeps {stay.capacity.sleeps}
          {stay.capacity.bedrooms ? ` · ${stay.capacity.bedrooms} bd` : ''}
        </p>
      </div>
    </article>
  );
}

function AlternativeBlock({ stay }: { stay: TripProposal['hero'] }) {
  return (
    <article
      className="rounded-[14px] border p-3"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {stay.photos[0] ? (
        <div
          className="relative w-full overflow-hidden rounded-[10px]"
          style={{ aspectRatio: '4/3' }}
        >
          <Image
            src={stay.photos[0].url}
            alt={stay.photos[0].alt}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
          />
        </div>
      ) : null}
      <h4
        className="mt-3 truncate"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body-lg)',
          fontWeight: 400,
          color: 'var(--ink-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {stay.name}
      </h4>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-body-sm)',
          color: 'var(--ink-tertiary)',
        }}
      >
        {stay.pricing.pricePerNight.amount.toLocaleString()} {stay.pricing.pricePerNight.currency} /
        night
      </p>
    </article>
  );
}

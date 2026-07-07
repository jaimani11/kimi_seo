'use client';

import { Sparkle } from '@/features/shared/icons';
import { useWorkspaceStore } from '../store/workspace-store';
import { useConciergeStream } from '../hooks/use-concierge-stream';

// Diverse suggestions across geographies + party shapes + vibes so the
// app reads as a real concierge from the first frame - not a "demo for
// Tuscany". Slice F1: opportunity board handles destinations we don't
// have curated inventory for, so every one of these resolves today.
const SUGGESTIONS = [
  'Austria ski trip for 6 people',
  'Vancouver luxury weekend near restaurants',
  'Tuscany, slow and walkable',
  'Tokyo for a long weekend',
  'Lisbon under €200/night, near music',
];

export function Greeting() {
  const setDraft = useWorkspaceStore((s) => s.setInputDraft);
  const { send } = useConciergeStream();

  return (
    <div className="px-5 pt-6 pb-4">
      <div
        className="mb-4 inline-flex items-center gap-2 text-[color:var(--ink-tertiary)]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <Sparkle size={11} style={{ color: 'var(--accent-primary)' }} />
        Concierge
      </div>
      <h1
        className="mb-3"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-display-sm)',
          fontWeight: 300,
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          color: 'var(--ink-primary)',
        }}
      >
        {greetingText()}
        <br />
        <em style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>next?</em>
      </h1>

      {/* What StayScout does - a single editorial line that orients new
       *  visitors before they pick a suggestion. */}
      <p
        className="mb-5 max-w-md"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-body-sm)',
          color: 'var(--ink-secondary)',
          lineHeight: 1.55,
        }}
      >
        Tell me about your next trip in plain English. Mention a city, a vibe, your party size,
        a budget. I&rsquo;ll surface real stays where I have them, or send you to Expedia, Vrbo,
        and Hotels.com with your search already filled in.
      </p>

      {/* "How it works" - three quick steps. Tiny + understated; doesn't
       *  compete with the suggestions below. */}
      <ol
        className="mb-5 space-y-1"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.7rem',
          color: 'var(--ink-tertiary)',
          letterSpacing: '0.01em',
          lineHeight: 1.55,
          counterReset: 'how-step',
        }}
      >
        {[
          'Type a destination or pick a suggestion below.',
          'I read the dates, party size, and vibe, then route you to the right partner.',
          'Click any card to land on the partner site with your search ready.',
        ].map((step, i) => (
          <li
            key={step}
            className="flex items-start gap-2"
            style={{ counterIncrement: 'how-step' }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.6rem',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                minWidth: '1.1rem',
                paddingTop: '0.05rem',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {/* Suggestion chips - pre-baked prompts that exercise both the
       *  curated-inventory path (Tuscany) and the search-opportunity
       *  path (Austria, Vancouver, Tokyo, Lisbon). */}
      <div
        className="mb-2"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        Try one
      </div>
      <ul className="space-y-1.5">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => {
                setDraft(s);
                void send({ rawInput: s });
              }}
              className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-2 text-left transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-[color:var(--border-emphasis)] hover:bg-[color:var(--surface-overlay)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--ink-secondary)',
              }}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Where to,';
  if (h < 12) return 'Good morning. Where to,';
  if (h < 18) return 'Good afternoon. Where to,';
  return 'Good evening. Where to,';
}

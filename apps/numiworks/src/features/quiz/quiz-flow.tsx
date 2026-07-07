'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { QUIZ_QUESTIONS, TOTAL_QUESTIONS } from '@lib/quiz/questions';
import {
  decodeAnswers,
  encodeAnswers,
  scoreQuiz,
  type QuizPick,
} from '@lib/quiz/scoring';
import { SCORE_DIMENSIONS } from '@lib/seo/destination-scores';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';

/**
 * Interactive "Where should I go?" quiz. Client-only — no
 * server round-trips. Results are computed from the DESTINATION_SCORES
 * map and rendered inline. Shareable via a URL param `?a=1,0,2,...`.
 */
export function QuizFlow({ initialAnswers }: { initialAnswers?: string | null }) {
  const decoded = useMemo(() => decodeAnswers(initialAnswers), [initialAnswers]);
  const [answers, setAnswers] = useState<number[]>(decoded);
  const [step, setStep] = useState<number>(
    decoded.length >= TOTAL_QUESTIONS ? TOTAL_QUESTIONS : 0,
  );

  const progressPct = Math.round((step / TOTAL_QUESTIONS) * 100);
  const done = step >= TOTAL_QUESTIONS;
  const picks = useMemo(() => (done ? scoreQuiz(answers) : []), [answers, done]);

  function choose(idx: number) {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
    setStep(step + 1);
  }

  function reset() {
    setAnswers([]);
    setStep(0);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }

  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  if (done) {
    return <QuizResults picks={picks} answers={answers} onRestart={reset} />;
  }

  const question = QUIZ_QUESTIONS[step]!;

  return (
    <section className="mx-auto max-w-2xl px-6 pt-10 pb-16">
      {/* progress bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '999px',
          background: 'rgba(148, 163, 184, 0.20)',
          overflow: 'hidden',
        }}
        aria-label={`Question ${step + 1} of ${TOTAL_QUESTIONS}`}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            borderRadius: '999px',
            transition: 'width 250ms ease',
          }}
        />
      </div>
      <p
        className="mt-4 text-center"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 600,
        }}
      >
        Question {step + 1} of {TOTAL_QUESTIONS}
      </p>
      <h1
        className="mt-4 text-center"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--ink-primary)',
        }}
      >
        {question.question}
      </h1>

      <div className="mt-8 grid gap-3">
        {question.options.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => choose(i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1.1rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-overlay)',
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--ink-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 120ms ease, border-color 120ms ease, background 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.35rem' }}>
              {opt.emoji}
            </span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {step > 0 ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={back}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--ink-tertiary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ← Back
          </button>
        </div>
      ) : null}
    </section>
  );
}

function QuizResults({
  picks,
  answers,
  onRestart,
}: {
  picks: QuizPick[];
  answers: readonly number[];
  onRestart: () => void;
}) {
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.search = `?a=${encodeAnswers(answers)}`;
    return url.toString();
  }, [answers]);

  const [copied, setCopied] = useState(false);
  function copyShareUrl() {
    if (!shareUrl || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-16">
      <div className="text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
          }}
        >
          Your top 3 destinations
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            color: 'var(--ink-primary)',
          }}
        >
          These match your travel style.
        </h1>
        <p
          className="mx-auto mt-3 max-w-2xl"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
          }}
        >
          Scored against 8 dimensions of travel intent. Click any card to open the full destination
          guide with bookable tours + stays.
        </p>
      </div>

      <div className="mt-10 grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {picks.map((pick, i) => (
          <PickCard key={pick.city.slug} pick={pick} rank={i + 1} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={copyShareUrl}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-overlay)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--ink-primary)',
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Link copied!' : '🔗 Share your results'}
        </button>
        <button
          type="button"
          onClick={onRestart}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
          }}
        >
          Take the quiz again
        </button>
      </div>
    </section>
  );
}

function PickCard({ pick, rank }: { pick: QuizPick; rank: number }) {
  const photo = resolveDestinationPhoto({
    name: pick.city.name,
    country: pick.city.countryCode,
    ...(pick.city.region ? { region: pick.city.region } : {}),
  });

  const dimensionLabels = pick.topDimensions.map((k) => {
    const dim = SCORE_DIMENSIONS.find((d) => d.key === k);
    return dim ? `${dim.emoji} ${dim.label}` : k;
  });

  return (
    <Link
      href={`/destinations/${pick.city.slug}?utm_source=quiz&utm_medium=recommendation`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '1rem',
        overflow: 'hidden',
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundImage: `url(${photo.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '0.85rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          #{rank}
        </div>
      </div>
      <div style={{ padding: '1.15rem 1.25rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            margin: 0,
          }}
        >
          {pick.city.countryName}
        </p>
        <h3
          className="mt-1"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.3rem',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--ink-primary)',
            margin: '0.25rem 0 0',
          }}
        >
          {pick.city.name}
        </h3>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            color: 'var(--ink-secondary)',
            margin: '0.5rem 0 0',
          }}
        >
          {pick.city.oneLiner}
        </p>
        {dimensionLabels.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {dimensionLabels.map((label) => (
              <span
                key={label}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(148, 163, 184, 0.14)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--ink-secondary)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

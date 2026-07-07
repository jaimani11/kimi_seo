'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Sparkle } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';
import { useVoiceInput } from './use-voice-input';
import type {
  OrchestratorEvent,
  EventOfKind,
} from '@core/orchestrator-event';
import type { ProposalRef } from '@core/partial';

/**
 * Agentic concierge hero — the home surface.
 *
 *   Type a trip in prose → POST `/api/concierge` → stream JSONL events →
 *   render visible agent steps + curated experience capsules with
 *   reasoning chips. Falls back to `/search?q=<prose>` if the stream
 *   fails so the user is never stuck.
 *
 * The same orchestrator that powered the H1–H4 workspace runs here;
 * what's new is the visible step ladder + capsule layout designed to
 * sit cleanly under the cinematic hero photo rather than the workspace
 * shell.
 */

const SAMPLE_PROMPTS = [
  '5 days Rome, foodie, low-key, second anniversary',
  'Tokyo weekend, first-timers, want one mind-blowing meal',
  'Cappadocia for 3 days with kids, balloon non-negotiable',
  'Lisbon and Sintra in 4 days, walkable, no tourist traps',
] as const;

export function AgenticHero() {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [refineDraft, setRefineDraft] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [capsules, setCapsules] = useState<ExperienceCapsule[]>([]);
  const [memoryHint, setMemoryHint] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [concierge, setConcierge] = useState<string | null>(null);
  const [proposalRef, setProposalRef] = useState<ProposalRef | null>(null);
  const [deltaNote, setDeltaNote] = useState<string | null>(null);
  const [history, setHistory] = useState<TurnHistoryItem[]>([]);
  const [opportunity, setOpportunity] = useState<OpportunityPanel | null>(null);
  const [errored, setErrored] = useState(false);
  const turnRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const impressionRef = useRef<string | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When the user arrives via the "AI concierge" nav link (a
  // /#agentic-concierge fragment URL), browsers scroll the section
  // top to the very top of the viewport — which sits behind the
  // sticky site header, so the user sees nothing change. We re-scroll
  // with smooth behavior, accounting for the header offset, AND focus
  // the textarea so the user can start typing immediately. Re-runs
  // whenever the hash changes so navigating back-and-forth between
  // pages re-engages the focus.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const focusComposerIfHash = () => {
      if (window.location.hash !== '#agentic-concierge') return;
      const target = document.getElementById('agentic-concierge');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Defer the focus call so the smooth scroll has a moment to
      // start; otherwise mobile Safari sometimes pre-empts the scroll
      // with the keyboard.
      window.setTimeout(() => composerTextareaRef.current?.focus(), 300);
    };
    focusComposerIfHash();
    window.addEventListener('hashchange', focusComposerIfHash);
    return () => window.removeEventListener('hashchange', focusComposerIfHash);
  }, []);

  // Fire `recommendation_impression` once per turn when capsules
  // first render. The ref-keyed guard means a re-render (or React
  // strict-mode double-mount) doesn't double-count.
  useEffect(() => {
    if (capsules.length === 0) return;
    const turnId = turnRef.current;
    if (!turnId || impressionRef.current === turnId) return;
    impressionRef.current = turnId;
    track('recommendation_impression', {
      ref: turnId,
      count: capsules.length,
    });
  }, [capsules]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const resetForCompose = useCallback(() => {
    setSteps([]);
    setCapsules([]);
    setMemoryHint(null);
    setDestination(null);
    setConcierge(null);
    setProposalRef(null);
    setDeltaNote(null);
    setHistory([]);
    setOpportunity(null);
    setErrored(false);
  }, []);

  const submit = useCallback(
    async (
      raw: string,
      args?: { refineFrom?: ProposalRef | null },
    ) => {
      const trimmed = raw.trim();
      if (!trimmed || running) return;
      const isRefine = Boolean(args?.refineFrom);
      abortRef.current?.abort();
      if (isRefine) {
        // Keep the prior capsules visible — they'll fade out as the
        // evolved proposal lands. Just clear steps + concierge text.
        setSteps([]);
        setConcierge(null);
        setDeltaNote(null);
        setOpportunity(null);
        setHistory((h) => [
          ...h,
          { kind: 'user', text: trimmed },
        ]);
      } else {
        resetForCompose();
        setHistory([{ kind: 'user', text: trimmed }]);
      }
      setRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const turnId = `t_${Math.random().toString(36).slice(2, 12)}`;
      turnRef.current = turnId;

      track(isRefine ? 'concierge_refine' : 'concierge_submit', {
        turnId,
        length: trimmed.length,
      });

      try {
        const res = await fetch('/api/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turnId,
            type: isRefine ? 'refine' : 'compose',
            input: {
              rawInput: trimmed,
              ...(args?.refineFrom ? { priorProposalRef: args.refineFrom } : {}),
            },
            clientCapabilities: {
              supportsAdaptationDelta: true,
              supportsMoodSnapshot: true,
              supportsMemoryHint: true,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`stream failed (${res.status})`);
        }

        await readJsonlStream(res.body, (event) => {
          if (turnRef.current !== turnId) return;
          applyEvent(event, {
            setSteps,
            setCapsules,
            setMemoryHint,
            setDestination,
            setConcierge,
            setProposalRef,
            setDeltaNote,
            setOpportunity,
          });
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (!isRefine) {
          setErrored(true);
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
          setErrored(true);
        }
      } finally {
        if (turnRef.current === turnId) setRunning(false);
      }
    },
    [resetForCompose, router, running],
  );

  const refine = useCallback(
    (raw: string) => {
      void submit(raw, { refineFrom: proposalRef });
      setRefineDraft('');
    },
    [submit, proposalRef],
  );

  const hasActivity =
    running || steps.length > 0 || capsules.length > 0 || opportunity !== null;

  return (
    <section
      id="agentic-concierge"
      className="relative w-full"
      style={{
        minHeight: hasActivity ? 'auto' : '64vh',
        background: 'var(--surface-base)',
        // Account for the sticky site header so /#agentic-concierge
        // jumps below the header rather than behind it. Without this
        // the nav click visually does nothing because the section
        // top lands underneath the sticky chrome.
        scrollMarginTop: '5rem',
      }}
    >
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=2400&q=80&fit=crop&auto=format"
          alt="Hot air balloons over Cappadocia at sunrise"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,10,14,0.55) 0%, rgba(8,10,14,0.72) 50%, rgba(8,10,14,0.85) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-6 pt-20 pb-14 text-center md:pt-24 md:pb-18">
        <p
          className="mb-4 inline-flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.82)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: '0.4rem',
              height: '0.4rem',
              borderRadius: '999px',
              background: '#FFE6B5',
              boxShadow: '0 0 8px rgba(255,230,181,0.6)',
            }}
          />
          AI concierge feature · Live Viator inventory
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(2.2rem, 4.8vw, 3.6rem)',
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            color: '#EDE6DB',
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            margin: 0,
            maxWidth: '48rem',
          }}
        >
          Or describe your trip.
          <br />
          <em style={{ fontStyle: 'italic', color: '#FFE6B5' }}>
            Let the agents plan it.
          </em>
        </h2>

        <p
          className="mt-5 max-w-xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'rgba(237,230,219,0.92)',
            textShadow: '0 1px 4px rgba(0,0,0,0.55)',
            margin: 0,
          }}
        >
          Type a sentence — destination, dates, who, the vibe. Specialized agents extract intent,
          search live Viator inventory, and surface a curated short-list with reasoning.
        </p>

        <ConciergeComposer
          draft={draft}
          setDraft={setDraft}
          submit={submit}
          running={running}
          disabled={false}
          textareaRef={composerTextareaRef}
        />

        {!hasActivity ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(237,230,219,0.65)',
                marginRight: '0.4rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              Or try
            </span>
            {SAMPLE_PROMPTS.map((p) => (
              <SamplePrompt
                key={p}
                text={p}
                onPick={(t) => {
                  setDraft(t);
                  void submit(t);
                }}
              />
            ))}
          </div>
        ) : null}

        {hasActivity ? (
          <ConciergeWorkbench
            steps={steps}
            capsules={capsules}
            destination={destination}
            memoryHint={memoryHint}
            concierge={concierge}
            running={running}
            errored={errored}
            deltaNote={deltaNote}
            history={history}
            opportunity={opportunity}
            canRefine={Boolean(proposalRef) && !running}
            refineDraft={refineDraft}
            setRefineDraft={setRefineDraft}
            onRefine={refine}
          />
        ) : null}

        <Link
          href="/search"
          className="mt-8 inline-flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.7)',
            textShadow: '0 1px 2px rgba(0,0,0,0.55)',
          }}
        >
          Or browse the catalog →
        </Link>
      </div>
    </section>
  );
}

// ============== Composer ==============

function ConciergeComposer({
  draft,
  setDraft,
  submit,
  running,
  textareaRef,
}: {
  draft: string;
  setDraft: (s: string) => void;
  submit: (raw: string) => void;
  running: boolean;
  disabled: boolean;
  /** Forwarded to the inner textarea so the parent can focus it when
   *  the page arrives at the agentic-concierge anchor. */
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const voice = useVoiceInput({
    onFinalTranscript: (text) => {
      setDraft(text);
    },
  });

  // Stream interim transcripts into the textarea so the user sees
  // their speech in real time. The final transcript is then carried
  // by setDraft above.
  if (voice.listening && voice.transcript.length > 0 && voice.transcript !== draft) {
    setDraft(voice.transcript);
  }

  const trimmed = draft.trim();
  const sendable = trimmed.length > 0 && !running;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!sendable) return;
        submit(draft);
      }}
      className="mt-10 w-full max-w-2xl"
    >
      <div
        className="flex items-end gap-3 px-5 py-3.5"
        style={{
          borderRadius: '1.25rem',
          background: 'rgba(12, 12, 14, 0.92)',
          border: `1px solid ${voice.listening ? 'var(--accent-primary)' : 'rgba(237,230,219,0.55)'}`,
          backdropFilter: 'blur(14px)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
          transition: 'border-color 180ms ease',
        }}
      >
        <Sparkle
          size={16}
          style={{ color: 'var(--accent-primary)', flexShrink: 0, marginBottom: '0.45rem' }}
        />
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={1}
          placeholder="e.g. 5 days Rome, foodie, low-key, second anniversary"
          aria-label="Describe your trip"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (sendable) submit(draft);
            }
          }}
          className="flex-1 resize-none bg-transparent outline-none"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            lineHeight: 1.45,
            color: '#EDE6DB',
            maxHeight: '10rem',
          }}
        />
        {voice.supported ? (
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            aria-label={voice.listening ? 'Stop voice input' : 'Speak your trip'}
            aria-pressed={voice.listening}
            style={{
              flexShrink: 0,
              width: '2.6rem',
              height: '2.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(237,230,219,0.45)',
              background: voice.listening
                ? 'var(--accent-primary)'
                : 'rgba(237,230,219,0.08)',
              color: voice.listening ? '#1a1a1a' : '#EDE6DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
          >
            {voice.listening ? <MicListeningIcon /> : <MicIcon />}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!sendable}
          aria-label={running ? 'Working' : 'Send to the concierge'}
          className="transition-transform hover:translate-x-0.5"
          style={{
            flexShrink: 0,
            width: '2.6rem',
            height: '2.6rem',
            borderRadius: '999px',
            border: 'none',
            background: sendable ? 'var(--accent-primary)' : 'rgba(237,230,219,0.18)',
            color: sendable ? '#1a1a1a' : 'rgba(237,230,219,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: sendable ? 'pointer' : 'not-allowed',
          }}
        >
          {running ? <PulseDot /> : <ArrowRight size={15} strokeWidth={2.4} />}
        </button>
      </div>
      {voice.listening ? (
        <p
          className="mt-2 text-center"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: 'var(--accent-primary)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            margin: '0.5rem 0 0',
          }}
        >
          Listening — say your trip, then pause.
        </p>
      ) : null}
    </form>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14M5.5 14h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicListeningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="6"
        y="2"
        width="4"
        height="8"
        rx="2"
        fill="currentColor"
      />
      <path
        d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14M5.5 14h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PulseDot() {
  return (
    <span
      aria-hidden
      style={{
        width: '0.55rem',
        height: '0.55rem',
        borderRadius: '999px',
        background: '#1a1a1a',
        animation: 'agentic-pulse 1.05s ease-in-out infinite',
      }}
    />
  );
}

function SamplePrompt({ text, onPick }: { text: string; onPick: (t: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(text)}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.72rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '999px',
        background: 'rgba(12, 12, 14, 0.78)',
        border: '1px solid rgba(237,230,219,0.4)',
        color: '#EDE6DB',
        cursor: 'pointer',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {text}
    </button>
  );
}

// ============== Workbench (visible agent steps + capsules) ==============

function ConciergeWorkbench({
  steps,
  capsules,
  destination,
  memoryHint,
  concierge,
  running,
  errored,
  deltaNote,
  history,
  opportunity,
  canRefine,
  refineDraft,
  setRefineDraft,
  onRefine,
}: {
  steps: AgentStep[];
  capsules: ExperienceCapsule[];
  destination: string | null;
  memoryHint: string | null;
  concierge: string | null;
  running: boolean;
  errored: boolean;
  deltaNote: string | null;
  history: TurnHistoryItem[];
  opportunity: OpportunityPanel | null;
  canRefine: boolean;
  refineDraft: string;
  setRefineDraft: (s: string) => void;
  onRefine: (raw: string) => void;
}) {
  return (
    <div
      className="mt-10 w-full max-w-3xl rounded-2xl border p-5 text-left md:p-6"
      style={{
        background: 'rgba(12, 12, 14, 0.78)',
        borderColor: 'rgba(237,230,219,0.18)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.72)',
            margin: 0,
          }}
        >
          {destination ? `Concierge · ${destination}` : 'Concierge'}
        </p>
        {running ? (
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '0.4rem',
                height: '0.4rem',
                borderRadius: '999px',
                background: 'var(--accent-primary)',
                animation: 'agentic-pulse 1.05s ease-in-out infinite',
              }}
            />
            Working
          </span>
        ) : null}
      </div>

      {history.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-1">
          {history.map((h, i) => (
            <li
              key={i}
              className="rounded-md border px-3 py-1.5"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                color: 'rgba(237,230,219,0.86)',
                background: 'rgba(237,230,219,0.05)',
                borderColor: 'rgba(237,230,219,0.12)',
                margin: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  marginRight: '0.55rem',
                }}
              >
                {i === 0 ? 'You' : 'Refine'}
              </span>
              {h.text}
            </li>
          ))}
        </ol>
      ) : null}

      {memoryHint ? (
        <p
          className="mt-3 rounded-xl border px-3 py-2"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '0.88rem',
            lineHeight: 1.5,
            color: '#EDE6DB',
            borderColor: 'rgba(237,230,219,0.22)',
            background: 'rgba(237,230,219,0.06)',
            margin: '0.8rem 0 0',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontStyle: 'normal',
              fontSize: '0.6rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginRight: '0.5rem',
            }}
          >
            Memory
          </span>
          {memoryHint}
        </p>
      ) : null}

      {deltaNote ? (
        <p
          className="mt-3 rounded-xl border px-3 py-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: '#FFE6B5',
            borderColor: 'rgba(255,196,87,0.32)',
            background: 'rgba(255,196,87,0.10)',
            margin: '0.8rem 0 0',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#FFC457',
              marginRight: '0.5rem',
            }}
          >
            Changed
          </span>
          {deltaNote}
        </p>
      ) : null}

      {steps.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1.5">
          {steps.map((s) => (
            <AgentStepRow key={s.stepId} step={s} />
          ))}
        </ul>
      ) : null}

      {concierge ? (
        <p
          className="mt-5"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1rem',
            lineHeight: 1.55,
            color: '#EDE6DB',
            margin: '1.2rem 0 0',
          }}
        >
          {concierge}
        </p>
      ) : null}

      {capsules.length > 0 ? (
        <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capsules.map((c) => (
            <CapsuleCard key={c.id} capsule={c} />
          ))}
        </ol>
      ) : null}

      {opportunity ? <OpportunityBoard panel={opportunity} /> : null}

      {!running &&
      !errored &&
      capsules.length === 0 &&
      !opportunity &&
      steps.length > 0 ? (
        <p
          className="mt-5 rounded-xl border px-4 py-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            color: 'rgba(237,230,219,0.85)',
            borderColor: 'rgba(237,230,219,0.18)',
            background: 'rgba(237,230,219,0.05)',
            margin: '1.2rem 0 0',
          }}
        >
          The agents finished but couldn&rsquo;t find a match for this query. Try
          rephrasing — for example, the city name or the kind of experience
          you&rsquo;d like (cooking class, day trip, balloon).
        </p>
      ) : null}

      {canRefine ? (
        <RefineComposer
          draft={refineDraft}
          setDraft={setRefineDraft}
          onSubmit={onRefine}
        />
      ) : null}

      {errored ? (
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'rgba(237,230,219,0.78)',
          }}
        >
          Concierge stream interrupted. Showing search results instead…
        </p>
      ) : null}
    </div>
  );
}

function RefineComposer({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: (raw: string) => void;
}) {
  const trimmed = draft.trim();
  const sendable = trimmed.length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (sendable) onSubmit(draft);
      }}
      className="mt-5 flex items-center gap-2 rounded-xl border px-3 py-2"
      style={{
        background: 'rgba(237,230,219,0.05)',
        borderColor: 'rgba(237,230,219,0.18)',
      }}
    >
      <Sparkle size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Refine — e.g. more wine, less walking, with kids…"
        aria-label="Refine the concierge's plan"
        className="flex-1 bg-transparent outline-none"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          color: '#EDE6DB',
          letterSpacing: '0.005em',
        }}
      />
      <button
        type="submit"
        disabled={!sendable}
        aria-label="Send refinement"
        className="transition-transform hover:translate-x-0.5"
        style={{
          flexShrink: 0,
          width: '2rem',
          height: '2rem',
          borderRadius: '999px',
          border: 'none',
          background: sendable ? 'var(--accent-primary)' : 'rgba(237,230,219,0.16)',
          color: sendable ? '#1a1a1a' : 'rgba(237,230,219,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: sendable ? 'pointer' : 'not-allowed',
        }}
      >
        <ArrowRight size={12} strokeWidth={2.4} />
      </button>
    </form>
  );
}

interface TurnHistoryItem {
  kind: 'user';
  text: string;
}

function AgentStepRow({ step }: { step: AgentStep }) {
  const color =
    step.state === 'failed'
      ? '#E07065'
      : step.state === 'done'
        ? 'var(--accent-primary)'
        : 'rgba(237,230,219,0.6)';
  return (
    <li
      className="flex items-center gap-3 rounded-lg border px-3 py-2"
      style={{
        background: 'rgba(237,230,219,0.04)',
        borderColor: 'rgba(237,230,219,0.14)',
      }}
    >
      <span
        aria-hidden
        className="grid place-items-center"
        style={{
          width: '0.85rem',
          height: '0.85rem',
          borderRadius: '999px',
          background: step.state === 'active' ? 'transparent' : color,
          border: step.state === 'active' ? `2px solid ${color}` : 'none',
          animation: step.state === 'active' ? 'agentic-pulse 1.2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      >
        {step.state === 'done' ? (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2 6L5 9L10 3"
              stroke="#14171C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span
        className="flex-1"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.82rem',
          color: '#EDE6DB',
          letterSpacing: '0.005em',
        }}
      >
        {step.label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '0.66rem',
          fontStyle: 'italic',
          color: 'rgba(237,230,219,0.55)',
        }}
      >
        · {step.agent}
      </span>
    </li>
  );
}

function CapsuleCard({ capsule }: { capsule: ExperienceCapsule }) {
  return (
    <li
      className="flex flex-col gap-2 rounded-xl border p-3"
      style={{
        background: 'rgba(20, 20, 24, 0.75)',
        borderColor: 'rgba(237,230,219,0.16)',
      }}
    >
      {capsule.photoUrl ? (
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: '4 / 3', background: '#222' }}
        >
          <Image
            src={capsule.photoUrl}
            alt={capsule.name}
            fill
            sizes="(max-width: 640px) 90vw, 33vw"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </div>
      ) : null}
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '0.95rem',
          fontWeight: 400,
          color: '#EDE6DB',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {capsule.name}
      </p>
      {capsule.reasons.length > 0 ? (
        <ul className="flex flex-wrap gap-1">
          {capsule.reasons.map((r) => (
            <li
              key={r}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.04em',
                color: 'rgba(237,230,219,0.85)',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(237,230,219,0.08)',
                border: '1px solid rgba(237,230,219,0.16)',
              }}
            >
              {r}
            </li>
          ))}
        </ul>
      ) : null}
      {capsule.href ? (
        <a
          href={capsule.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-1 inline-flex items-center gap-1 transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            color: 'var(--accent-primary)',
          }}
        >
          Reserve on Viator
          <ArrowRight size={11} strokeWidth={2.4} />
        </a>
      ) : null}
    </li>
  );
}

// ============== Opportunity board ==============

function OpportunityBoard({ panel }: { panel: OpportunityPanel }) {
  return (
    <div
      className="mt-5 overflow-hidden rounded-xl border"
      style={{
        borderColor: 'rgba(237,230,219,0.18)',
        background: 'rgba(20, 20, 24, 0.72)',
      }}
    >
      {panel.photoUrl ? (
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '4 / 1.5',
            background: '#0c0c0e',
          }}
        >
          <Image
            src={panel.photoUrl}
            alt={panel.photoAlt ?? panel.destination ?? 'destination'}
            fill
            sizes="(max-width: 768px) 90vw, 720px"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,10,14,0.05) 0%, rgba(8,10,14,0.75) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(237,230,219,0.85)',
                margin: 0,
              }}
            >
              Search-opportunity
            </p>
            <h3
              className="mt-1"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '1.6rem',
                fontWeight: 400,
                letterSpacing: '-0.015em',
                color: '#EDE6DB',
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              Things to do in {panel.destination || 'this destination'}
            </h3>
            {panel.flavor ? (
              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  color: 'rgba(237,230,219,0.88)',
                  margin: 0,
                  maxWidth: '38rem',
                }}
              >
                {panel.flavor}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="p-4">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            color: 'rgba(237,230,219,0.86)',
            margin: 0,
          }}
        >
          {panel.destination
            ? `Pick a category to jump straight into bookable Viator experiences in ${panel.destination} — same price as direct, free cancellation on most.`
            : 'Pick a category to jump into bookable Viator experiences for this destination — same price as direct, free cancellation on most.'}
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {panel.providers.map((p) => (
            <li key={p.providerId}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex h-full flex-col gap-1 rounded-lg border p-3 transition-colors hover:border-[color:var(--accent-primary)]"
                style={{
                  background: 'rgba(237,230,219,0.04)',
                  borderColor: 'rgba(237,230,219,0.16)',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#EDE6DB',
                  }}
                >
                  {p.title}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    color: 'rgba(237,230,219,0.7)',
                  }}
                >
                  {p.hint}
                </span>
                <span
                  className="mt-1 inline-flex items-center gap-1"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Search now <ArrowRight size={11} strokeWidth={2.4} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function opportunitySlotTitle(providerId: string): string {
  switch (providerId) {
    // Active Viator categories (post-Viator pivot).
    case 'viator-top':
      return 'Top experiences';
    case 'viator-day-trips':
      return 'Day trips';
    case 'viator-food':
      return 'Food & cooking';
    // Legacy hotel-flavor slots, kept for historical persisted payloads.
    case 'expedia':
      return 'Hotels & apart-hotels';
    case 'vrbo':
      return 'Vacation rentals';
    case 'hotels-com':
      return '4★+ hotels';
    case 'booking-com':
      return 'Hotels worldwide';
    default:
      return 'Experiences';
  }
}

// ============== Stream consumption ==============

interface AgentStep {
  stepId: string;
  agent: string;
  label: string;
  state: 'active' | 'done' | 'failed';
}

interface ExperienceCapsule {
  id: string;
  name: string;
  photoUrl: string | null;
  reasons: string[];
  href: string | null;
}

interface ApplyEventTargets {
  setSteps: React.Dispatch<React.SetStateAction<AgentStep[]>>;
  setCapsules: React.Dispatch<React.SetStateAction<ExperienceCapsule[]>>;
  setMemoryHint: React.Dispatch<React.SetStateAction<string | null>>;
  setDestination: React.Dispatch<React.SetStateAction<string | null>>;
  setConcierge: React.Dispatch<React.SetStateAction<string | null>>;
  setProposalRef: React.Dispatch<React.SetStateAction<ProposalRef | null>>;
  setDeltaNote: React.Dispatch<React.SetStateAction<string | null>>;
  setOpportunity: React.Dispatch<React.SetStateAction<OpportunityPanel | null>>;
}

export interface OpportunityPanel {
  destination: string;
  flavor: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  providers: OpportunityProvider[];
}

interface OpportunityProvider {
  providerId: string;
  /** Visitor-facing title, e.g. "Hotels & apart-hotels". */
  title: string;
  hint: string;
  url: string;
}

function applyEvent(event: OrchestratorEvent, t: ApplyEventTargets) {
  switch (event.kind) {
    case 'agent.step.started': {
      const e = event as EventOfKind<'agent.step.started'>;
      t.setSteps((prev) =>
        upsertStep(prev, e.stepId, {
          agent: e.agentId,
          label: prettyLabel(e.agentId, e.label),
          state: 'active',
        }),
      );
      return;
    }
    case 'agent.step.completed': {
      const e = event as EventOfKind<'agent.step.completed'>;
      t.setSteps((prev) =>
        prev.map((s) => (s.stepId === e.stepId ? { ...s, state: 'done' as const } : s)),
      );
      return;
    }
    case 'agent.step.failed': {
      const e = event as EventOfKind<'agent.step.failed'>;
      t.setSteps((prev) =>
        prev.map((s) => (s.stepId === e.stepId ? { ...s, state: 'failed' as const } : s)),
      );
      return;
    }
    case 'intent.extracted': {
      const e = event as EventOfKind<'intent.extracted'>;
      const dest = e.intent?.destinations?.[0]?.name;
      if (dest) t.setDestination(dest);
      return;
    }
    case 'proposal.ready':
    case 'proposal.evolved': {
      const e = event as EventOfKind<'proposal.ready'> | EventOfKind<'proposal.evolved'>;
      const stays = readProposalStays(e);
      if (stays.length > 0) {
        t.setCapsules(stays.slice(0, 3));
      }
      if (event.kind === 'proposal.evolved') {
        const note = summarizeProposalDiff(
          event as EventOfKind<'proposal.evolved'>,
        );
        if (note) t.setDeltaNote(note);
      }
      return;
    }
    case 'proposal.bookmarkable': {
      const e = event as EventOfKind<'proposal.bookmarkable'>;
      t.setProposalRef(e.ref);
      return;
    }
    case 'concierge.message': {
      const e = event as EventOfKind<'concierge.message'>;
      if (e.message) t.setConcierge(e.message);
      return;
    }
    case 'concierge.memory.hint': {
      const e = event as EventOfKind<'concierge.memory.hint'>;
      if (e.message) t.setMemoryHint(e.message);
      return;
    }
    case 'search.opportunity.ready': {
      const e = event as EventOfKind<'search.opportunity.ready'>;
      const opp = e.opportunity;
      if (!opp) return;
      t.setOpportunity({
        destination: opp.destination?.name ?? '',
        flavor: opp.flavor ?? null,
        photoUrl: opp.photoUrl ?? null,
        photoAlt: opp.photoAlt ?? null,
        providers: (opp.providers ?? []).map((p) => ({
          providerId: p.providerId,
          title: opportunitySlotTitle(p.providerId),
          hint: p.hint ?? '',
          url: p.url,
        })),
      });
      return;
    }
    default:
      return;
  }
}

function upsertStep(
  prev: AgentStep[],
  stepId: string,
  partial: Omit<AgentStep, 'stepId'>,
): AgentStep[] {
  const idx = prev.findIndex((s) => s.stepId === stepId);
  if (idx === -1) return [...prev, { stepId, ...partial }];
  const next = [...prev];
  next[idx] = { stepId, ...partial };
  return next;
}

function prettyLabel(agent: string, fallback: string | null | undefined): string {
  if (fallback && fallback.length > 0) return fallback;
  switch (agent) {
    case 'intent':
      return 'Reading your trip';
    case 'memory':
      return 'Checking what you valued before';
    case 'destination-flavor':
      return 'Tasting the place';
    case 'search':
      return 'Searching live Viator inventory';
    case 'mood':
      return 'Composing the vibe';
    case 'curate':
      return 'Ranking the short-list';
    default:
      return agent;
  }
}

/** Stringify the most-interesting bits of a proposal.evolved.diff
 *  into one user-readable sentence. Falls back to a soft generic when
 *  the diff is empty/structureless. */
function summarizeProposalDiff(event: EventOfKind<'proposal.evolved'>): string | null {
  const diff = (event as unknown as { diff?: { changes?: ProposalDiffChange[] } }).diff;
  if (!diff || !Array.isArray(diff.changes) || diff.changes.length === 0) {
    return 'Updated the short-list based on your refinement.';
  }
  const swap = diff.changes.find((c) => c.kind === 'swapped');
  if (swap?.fromName && swap?.toName) {
    return `Swapped ${swap.fromName} for ${swap.toName}.`;
  }
  const added = diff.changes.find((c) => c.kind === 'added');
  if (added?.toName) {
    return `Added ${added.toName} to the short-list.`;
  }
  const dropped = diff.changes.find((c) => c.kind === 'dropped');
  if (dropped?.fromName) {
    return `Dropped ${dropped.fromName} from the short-list.`;
  }
  return `${diff.changes.length} updates to the short-list.`;
}

interface ProposalDiffChange {
  kind: 'added' | 'dropped' | 'swapped' | 'reranked';
  fromName?: string;
  toName?: string;
}

function readProposalStays(
  event: EventOfKind<'proposal.ready'> | EventOfKind<'proposal.evolved'>,
): ExperienceCapsule[] {
  // Defensive read — the proposal shape carries .proposal.hero and
  // .proposal.alternatives in both event kinds. Fall through gracefully
  // if a future shape lands here.
  const proposal = (event as unknown as { proposal?: ProposalLike }).proposal;
  if (!proposal) return [];
  const all: StayLike[] = [];
  if (proposal.hero) all.push(proposal.hero);
  if (Array.isArray(proposal.alternatives)) all.push(...proposal.alternatives);
  return all
    .filter((s): s is StayLike => Boolean(s && s.id))
    .map((s) => {
      const reasons = pickReasons(s);
      return {
        id: s.id,
        name: s.name ?? 'Experience',
        photoUrl: s.photos?.[0]?.url ?? null,
        reasons,
        href: s.bookingLink?.url ?? null,
      };
    });
}

function pickReasons(s: StayLike): string[] {
  const out: string[] = [];
  if (s.signals?.tags?.length) out.push(...s.signals.tags.slice(0, 3));
  if (out.length === 0) out.push('Curator pick');
  return out;
}

interface ProposalLike {
  hero?: StayLike;
  alternatives?: StayLike[];
}
interface StayLike {
  id: string;
  name?: string;
  photos?: { url: string }[];
  bookingLink?: { url?: string };
  signals?: { tags?: string[] };
}

async function readJsonlStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: OrchestratorEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line.length > 0) {
        try {
          const parsed = JSON.parse(line) as OrchestratorEvent;
          onEvent(parsed);
        } catch {
          // Drop malformed lines silently — never block the stream
          // on a single bad event.
        }
      }
      nl = buffer.indexOf('\n');
    }
  }
  if (buffer.trim().length > 0) {
    try {
      onEvent(JSON.parse(buffer) as OrchestratorEvent);
    } catch {
      /* trailing partial — drop */
    }
  }
}

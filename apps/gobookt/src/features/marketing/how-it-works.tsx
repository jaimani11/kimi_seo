import { Sparkle } from '@/features/shared/icons';

const STEPS = [
  {
    eyebrow: '01',
    headline: 'You write a sentence.',
    body: 'No filters, no dropdowns. Tell the concierge in your own words - destination, dates, who, vibe. The Intent Agent turns it into structured trip context the rest of the system reasons against.',
    visual: 'intent',
  },
  {
    eyebrow: '02',
    headline: 'Specialized agents do the work.',
    body: 'Named agents run in sequence - read your trip, search inventory, rank by your signals, compose a vibe. Each step is visible. Slice B brings real provider integrations behind the same wire.',
    visual: 'agents',
  },
  {
    eyebrow: '03',
    headline: 'You stay in control.',
    body: 'A curated proposal - hero pick, alternatives, reasoning chips. Refine in plain English. Pin to compare. The system never books on your behalf in Slice A.',
    visual: 'trip-board',
  },
] as const;

/**
 * Below-fold "How It Works" - three sticky-scroll steps. RSC for SEO and
 * fast first-paint. Cool-blue bloom layered behind to break the dark
 * monotony of the workspace fold above.
 */
export function HowItWorks() {
  return (
    <section
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, var(--surface-base) 0%, var(--surface-raised) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(80,120,200,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-32">
        <div className="mb-20">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            How it works
          </p>
          <h2
            className="mt-3 max-w-2xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-lg)',
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--ink-primary)',
            }}
          >
            A travel concierge,
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              that actually listens.
            </em>
          </h2>
        </div>

        <ol className="grid gap-y-32">
          {STEPS.map((step) => (
            <li
              key={step.eyebrow}
              className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12"
            >
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: 'var(--text-body-sm)',
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  {step.eyebrow}
                </p>
                <h3
                  className="mt-2"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'var(--text-display-md)',
                    fontWeight: 400,
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                    color: 'var(--ink-primary)',
                  }}
                >
                  {step.headline}
                </h3>
                <p
                  className="mt-4 max-w-md"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-body-lg)',
                    lineHeight: 1.5,
                    color: 'var(--ink-secondary)',
                  }}
                >
                  {step.body}
                </p>
              </div>
              <StepVisual variant={step.visual} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepVisual({ variant }: { variant: 'intent' | 'agents' | 'trip-board' }) {
  if (variant === 'intent') return <IntentVisual />;
  if (variant === 'agents') return <AgentsVisual />;
  return <TripBoardVisual />;
}

function IntentVisual() {
  return (
    <div
      className="rounded-[18px] border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full border px-3 py-2"
        style={{
          background: 'var(--surface-overlay)',
          borderColor: 'var(--border-emphasis)',
        }}
      >
        <Sparkle size={12} style={{ color: 'var(--accent-primary)' }} />
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-primary)',
          }}
        >
          Italy 7 days, family of 4, walkable, no tourist traps.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ['Destination', 'Italy · IT'],
          ['Duration', '7 nights'],
          ['Travelers', 'Family of 4'],
          ['Vibe', 'walkable · avoid-tourist-traps'],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border px-3 py-2"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.625rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-tertiary)',
              }}
            >
              {k}
            </p>
            <p
              className="mt-0.5"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--ink-primary)',
              }}
            >
              {v}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsVisual() {
  const steps = [
    { label: 'Read your trip', agent: 'intent', state: 'done' },
    { label: 'Searched 12 stays', agent: 'search', state: 'done' },
    { label: 'Composing the vibe', agent: 'mood', state: 'active' },
  ] as const;
  return (
    <div
      className="rounded-[18px] border p-5"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li
            key={s.agent}
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {s.state === 'done' ? (
              <span
                aria-hidden
                className="grid h-3 w-3 place-items-center rounded-full"
                style={{ background: 'var(--accent-primary)' }}
              >
                <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="#14171C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: 'var(--accent-primary)',
                  background: 'var(--accent-primary-soft)',
                }}
              />
            )}
            <span
              className="flex-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--ink-secondary)',
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.6875rem',
                color: 'var(--accent-primary)',
                fontStyle: 'italic',
              }}
            >
              · {s.agent}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TripBoardVisual() {
  return (
    <div
      className="overflow-hidden rounded-[22px] border"
      style={{
        background: 'linear-gradient(135deg, rgba(111,129,112,0.95), rgba(44,58,48,0.95))',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-hero)',
        aspectRatio: '4/3',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-5">
        <span
          className="self-start rounded-full px-2.5 py-1"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Top pick
        </span>
        <div className="flex items-end justify-between">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-display-sm)',
                fontWeight: 400,
                color: '#EDE6DB',
                lineHeight: 1.05,
              }}
            >
              Villa di Geggiano
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'rgba(237,230,219,0.7)',
              }}
            >
              Tuscany · 8 minutes from Siena
            </p>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-sm)',
              color: 'var(--accent-primary)',
            }}
          >
            420 <span style={{ fontSize: 'var(--text-body-sm)' }}>EUR</span>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Sparkle } from '@/features/shared/icons';

const TILES = [
  {
    eyebrow: 'Architecture',
    headline: 'Specialized agents, not a chatbot.',
    body: 'Named agents - intent, search, ranking, mood, memory - work in sequence on your trip. Each step is visible in the chat sidebar. The orchestrator owns the wire format; the UI never knows about the LLM.',
    accent: 'var(--accent-primary)',
  },
  {
    eyebrow: 'Trust',
    headline: 'Honest about how we make money.',
    body: 'We earn affiliate commission on bookings. Prices are identical to booking direct. Slice B wires the click-attribution route handler. No hidden margins, no provider-specific bias.',
    accent: 'var(--accent-secondary)',
  },
  {
    eyebrow: 'Personalization',
    headline: 'Memory that improves with you.',
    body: 'Slice A keeps a session-scoped memory hinter. Slice C upgrades to a real Memory Agent reading from pgvector - preferences, pace, walkability bias, food priority. Same wire format; the UI tile is already in place.',
    accent: 'var(--accent-primary)',
  },
] as const;

export function WhyStayScout() {
  return (
    <section
      className="relative w-full"
      style={{
        background:
          'linear-gradient(180deg, var(--featured-bg) 0%, var(--surface-base) 35%, var(--surface-base) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24">
        <div className="mb-14 max-w-2xl">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-tertiary)',
            }}
          >
            Why StayScout
          </p>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-display-lg)',
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--ink-primary)',
            }}
          >
            Built like the
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
              software you&rsquo;d want to keep using.
            </em>
          </h2>
        </div>

        <ul className="grid gap-6 lg:grid-cols-3">
          {TILES.map((tile) => (
            <li
              key={tile.headline}
              className="flex flex-col rounded-[20px] border p-6"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--elev-card)',
              }}
            >
              <Sparkle size={14} style={{ color: tile.accent }} />
              <p
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                }}
              >
                {tile.eyebrow}
              </p>
              <h3
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-display-sm)',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink-primary)',
                }}
              >
                {tile.headline}
              </h3>
              <p
                className="mt-3 flex-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body)',
                  lineHeight: 1.55,
                  color: 'var(--ink-secondary)',
                }}
              >
                {tile.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

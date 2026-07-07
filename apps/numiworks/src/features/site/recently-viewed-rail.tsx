import Link from 'next/link';
import Image from 'next/image';
import { getSessionStore } from '@lib/session/factory';
import { getServerAuth } from '@lib/auth';
import { recentlyViewedFromEvents } from '@lib/analytics/recently-viewed';

/**
 * "Pick up where you left off" — Sprint 18.
 *
 * Server component. Reads the current session's `experience_view`
 * events from the funnel-event log (Sprint 17), reduces them to a
 * deduped most-recent-first list with the snapshot captured at view
 * time (title, hero image, destination, price), and renders a
 * horizontal rail of compact cards linking back to /experiences/[code].
 *
 * Hides itself when there are fewer than 2 unique items so the home
 * isn't littered with a one-card rail on a first visit.
 *
 * Session-bound by sessionId, which means an anonymous visitor's rail
 * survives navigation within the visit; a logged-in user sees the
 * rail of *this* device's recent views. Cross-device "recently
 * viewed" for authenticated users would key on userId — that's a
 * follow-up sprint, not Sprint 18.
 */
export async function RecentlyViewedRail() {
  const auth = await getServerAuth();
  const store = getSessionStore();
  // Bound the read — the rail only ever shows 8 items, and a session
  // is unlikely to have viewed more than ~200 experiences in one go.
  const events = await store.listEvents({
    kind: 'experience_view',
    sessionId: auth.sessionId,
    limit: 200,
  });
  const items = recentlyViewedFromEvents(events, 8);
  if (items.length < 2) return null;

  return (
    <section
      className="w-full"
      style={{
        background: 'var(--surface-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                margin: 0,
              }}
            >
              Pick up where you left off
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'clamp(1.5rem, 2.8vw, 2rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--ink-primary)',
                margin: 0,
              }}
            >
              You were just{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent-primary)' }}>
                looking at these.
              </em>
            </h2>
          </div>
        </header>

        <ul
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <li
              key={item.productCode}
              className="shrink-0"
              style={{
                scrollSnapAlign: 'start',
                width: 'clamp(220px, 28vw, 280px)',
              }}
            >
              <Link
                href={`/experiences/${item.productCode}`}
                className="group block overflow-hidden"
                style={{
                  borderRadius: '0.875rem',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                <div
                  className="relative w-full"
                  style={{ aspectRatio: '4 / 3', background: '#0c0c0e' }}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 60vw, 28vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
                <div className="p-3.5">
                  {item.destination ? (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-tertiary)',
                        margin: 0,
                      }}
                    >
                      {item.destination}
                    </p>
                  ) : null}
                  <h3
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-fraunces)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      lineHeight: 1.25,
                      color: 'var(--ink-primary)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.title}
                  </h3>
                  {item.priceFromUsd ? (
                    <p
                      className="mt-2"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--ink-secondary)',
                        margin: 0,
                      }}
                    >
                      From ${Math.round(item.priceFromUsd)}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

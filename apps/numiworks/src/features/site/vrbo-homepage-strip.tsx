import Link from 'next/link';
import { wrapVrboAffiliate } from '@lib/affiliate/vrbo-link';

/**
 * Homepage secondary-CTA strip — two cards side-by-side that surface
 * numiworks's two non-Viator revenue paths at first paint:
 *
 *   Left card  — VRBO whole-home rentals (Expedia Group affiliate,
 *                highest commission in the family, 8-10%)
 *   Right card — AI concierge teaser (deep-linked to the full
 *                #agentic-concierge section below the fold)
 *
 * Sitting between SearchFormHero and StatsBand, this strip means
 * every visitor sees BOTH the whole-home CTA and the AI concierge
 * preview without scrolling to the giant cinematic AgenticHero
 * section further down.
 *
 * Env:
 *   NEXT_PUBLIC_VRBO_SHORTLINK  Optional override for the affiliate
 *                               shortlink. Defaults to the account's
 *                               Link Builder-generated bounce URL.
 */

// Warm sunset (numiworks = experiences brand) — not VRBO's own blue, so the
// homepage stays on one coral identity. VRBO is still named in the card copy.
const VRBO_BG = 'linear-gradient(135deg, #b3360f 0%, #d84315 55%, #f2683a 100%)';
const CONCIERGE_BG = 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)';
const YELLOW = '#FBC700';
const INK_ON_DARK = '#ffffff';

export function VrboHomepageStrip() {
  // Tracked VRBO entry point (general "browse rentals" promo, not a destination
  // result). Fails closed to numiworks' own search when VRBO is unconfigured,
  // never an untracked homepage bounce.
  const shortlink = wrapVrboAffiliate('https://www.vrbo.com/') ?? '/search';

  return (
    <section className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* VRBO whole-home card */}
        <a
          href={shortlink}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="group block rounded-2xl border-2 transition-transform hover:scale-[1.01]"
          style={{
            background: VRBO_BG,
            borderColor: YELLOW,
            padding: '1.25rem 1.4rem',
            textDecoration: 'none',
            boxShadow: '0 8px 24px -10px rgba(0,120,193,0.35)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: YELLOW,
              fontWeight: 800,
              margin: 0,
            }}
          >
            Whole homes · VRBO
          </p>
          <h3
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              color: INK_ON_DARK,
              margin: 0,
            }}
          >
            Prefer a whole home? Cabins, villas &amp; beach houses on VRBO.
          </h3>
          <p
            className="mt-2 flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
            }}
          >
            Full kitchens, more space for groups.
            <span
              style={{
                marginLeft: 'auto',
                background: YELLOW,
                color: '#0A2B45',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Browse rentals →
            </span>
          </p>
        </a>

        {/* AI concierge teaser card */}
        <Link
          href="/#agentic-concierge"
          className="group block rounded-2xl border transition-transform hover:scale-[1.01]"
          style={{
            background: CONCIERGE_BG,
            borderColor: 'rgba(255,255,255,0.15)',
            padding: '1.25rem 1.4rem',
            textDecoration: 'none',
            boxShadow: '0 8px 24px -10px rgba(0,0,0,0.45)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#a5b4fc',
              fontWeight: 800,
              margin: 0,
            }}
          >
            ✨ AI concierge · plan your whole trip
          </p>
          <h3
            className="mt-1"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              color: INK_ON_DARK,
              margin: 0,
            }}
          >
            Or describe your trip. Let the agents plan it.
          </h3>
          <p
            className="mt-2 flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
            }}
          >
            &quot;5 days Rome, foodie, low-key&quot; → itinerary.
            <span
              style={{
                marginLeft: 'auto',
                background: '#ffffff',
                color: '#0f172a',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Try concierge →
            </span>
          </p>
        </Link>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChevronRight, Sparkle, Send } from '@/features/shared/icons';
import { DiscoveryRail, type ExperienceRailSection } from '@/features/discovery';
import { DISCOVERY_SECTIONS } from '@lib/discovery/sections';
import { LiveExperiencesRail } from './live-experiences-rail';
import { useWorkspaceStore } from '../store/workspace-store';
import { useConciergeStream } from '../hooks/use-concierge-stream';

/**
 * Landing page - what visitors see before they describe a trip.
 *
 * Layout:
 *
 *   1. Full-bleed hero with a rotating destination photo carousel
 *      as the background and the natural-language search bar centered
 *      on top of it.
 *   2. A sequence of discovery rails below the hero, driven by the
 *      curated `DISCOVERY_SECTIONS` dataset. Each rail picks its own
 *      layout (carousel, hero-rail, grid, editorial-slab) so the
 *      browse experience varies as the user scrolls.
 *   3. Disclosure footer at the bottom of the page.
 *
 * When the user submits the search (or types in the input + presses
 * enter), the workspace switches over to the chat-sidebar + canvas
 * split via the `useWorkspaceStore` state machine (a turn appears,
 * the landing page unmounts).
 *
 * This component is rendered by Workspace.tsx when no turn exists.
 * The chat-sidebar + canvas shell takes over after the first turn.
 */

interface CarouselSlide {
  name: string;
  region: string;
  country: string;
  id: string;
  alt: string;
  photographer: string;
  gradient: [string, string];
}

const SLIDES: readonly CarouselSlide[] = [
  {
    name: 'Tokyo',
    region: 'Japan',
    country: 'JP',
    id: '1540959733332-eab4deabeeaf',
    alt: 'Tokyo Shibuya neon at night',
    photographer: 'Jezael Melgoza',
    gradient: ['#0f1c3a', '#5b2466'],
  },
  {
    name: 'Paris',
    region: 'France',
    country: 'FR',
    id: '1431274172761-fca41d930114',
    alt: 'Paris Eiffel Tower at dusk',
    photographer: 'Chris Karidis',
    gradient: ['#2a2a4a', '#7a5a3a'],
  },
  {
    name: 'Iceland',
    region: 'Reykjavík + the ring road',
    country: 'IS',
    id: '1500530855697-b586d89ba3ee',
    alt: 'Iceland aurora over glacial landscape',
    photographer: 'Jonatan Pie',
    gradient: ['#0a1d2e', '#1c4d6e'],
  },
  {
    name: 'Kyoto',
    region: 'Japan',
    country: 'JP',
    id: '1493976040374-85c8e12f0c0e',
    alt: 'Kyoto Fushimi Inari torii gates',
    photographer: 'Sorasak',
    gradient: ['#3a1a1a', '#8b2c2c'],
  },
  {
    name: 'Vancouver',
    region: 'Canada · Pacific Northwest',
    country: 'CA',
    id: '1502086223501-7ea6ecd79368',
    alt: 'Vancouver skyline and Stanley Park',
    photographer: 'Mike Benna',
    gradient: ['#1a2a3a', '#3a5a7a'],
  },
  {
    name: 'Patagonia',
    region: 'Argentina + Chile',
    country: 'AR',
    id: '1486870591958-9b9d0d1dda99',
    alt: 'Patagonia Torres del Paine peaks',
    photographer: 'Casey Horner',
    gradient: ['#1a2a3a', '#5a7a9a'],
  },
  {
    name: 'Sydney',
    region: 'Australia',
    country: 'AU',
    id: '1506973035872-a4ec16b8e8d9',
    alt: 'Sydney Opera House and Harbour Bridge',
    photographer: 'Caleb',
    gradient: ['#1a3a5a', '#3a8aba'],
  },
  {
    name: 'Maldives',
    region: 'Indian Ocean',
    country: 'MV',
    id: '1499678329028-101435549a4e',
    alt: 'Maldives overwater bungalows',
    photographer: 'Cassie Matias',
    gradient: ['#0a4f7a', '#3aafbf'],
  },
];

const SLIDE_INTERVAL_MS = 5000;
const FIRST_ADVANCE_MS = 1000;

function unsplashUrl(id: string, width: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&fit=crop&auto=format`;
}

// ============== LandingPage ==============

export function LandingPage() {
  return (
    <div className="relative h-full w-full overflow-y-auto">
      <LandingHero />
      <DiscoverySections />
      <LiveExperienceSections />
      <LandingFooter />
    </div>
  );
}

// ============== Hero ==============

function LandingHero() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setIndex((i) => (i + 1) % SLIDES.length);
        schedule(SLIDE_INTERVAL_MS);
      }, delay);
    };
    schedule(FIRST_ADVANCE_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isHovered]);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const slide = SLIDES[index]!;

  return (
    <section
      className="relative w-full"
      style={{ minHeight: '85vh' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo layer */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
          <SafePhoto slide={slide} />
        </motion.div>
      </AnimatePresence>

      {/* Base darkening layer over the whole photo - just enough to
       *  knock back hyper-saturated photography (neon-lit Tokyo,
       *  glacier sunlight) without losing the destination feel. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      {/* Radial vignette that focuses on the centered editorial block.
       *  Darkens more aggressively around the text than at the edges so
       *  the title + tagline + search bar are unambiguously legible. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Centered editorial + search */}
      <div className="relative z-10 flex h-full min-h-[85vh] flex-col items-center justify-center px-6 pt-16 pb-24">
        <div
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.85)',
            padding: '0.3rem 0.7rem',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(237,230,219,0.4)',
            borderRadius: '0.25rem',
            backdropFilter: 'blur(6px)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            marginBottom: '1.5rem',
          }}
        >
          StayScout · public preview
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(3rem, 6vw, 5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#EDE6DB',
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 18px rgba(0,0,0,0.7)',
            margin: 0,
            textAlign: 'center',
            maxWidth: '46rem',
          }}
        >
          Where to,{' '}
          <em style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>next?</em>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
            lineHeight: 1.5,
            color: '#EDE6DB',
            textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 3px 10px rgba(0,0,0,0.7)',
            margin: '1.2rem 0 2.4rem',
            textAlign: 'center',
            maxWidth: '38rem',
          }}
        >
          A concierge for the trip you actually want to take. Tell me a city, a vibe, a budget,
          a party size. I&rsquo;ll find real stays or hand you off to our booking partners with
          your search already filled in.
        </p>

        <NaturalLanguageSearch />

        {/* Slide labels + nav */}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous destination"
            style={chevronButtonStyle}
          >
            <ChevronRight
              size={14}
              strokeWidth={2.4}
              style={{ transform: 'rotate(180deg)' }}
            />
          </button>

          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              letterSpacing: '0.06em',
              color: 'rgba(237,230,219,0.85)',
              textShadow: '0 1px 2px rgba(0,0,0,0.55)',
              minWidth: '12rem',
              textAlign: 'center',
            }}
          >
            <strong style={{ fontWeight: 500 }}>{slide.name}</strong>
            <span style={{ opacity: 0.7 }}>{` · ${slide.region}`}</span>
          </div>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next destination"
            style={chevronButtonStyle}
          >
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.name}`}
              aria-current={i === index}
              style={{
                width: i === index ? '1.4rem' : '0.4rem',
                height: '0.2rem',
                borderRadius: '0.2rem',
                background: i === index ? 'rgba(237,230,219,0.95)' : 'rgba(237,230,219,0.4)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 500ms ease, background 500ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SafePhoto({ slide }: { slide: CarouselSlide }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(140deg, ${slide.gradient[0]} 0%, ${slide.gradient[1]} 100%)`,
        }}
      />
    );
  }
  return (
    <Image
      src={unsplashUrl(slide.id, 2000)}
      alt={slide.alt}
      fill
      sizes="100vw"
      style={{ objectFit: 'cover' }}
      priority
      onError={() => setOk(false)}
    />
  );
}

// ============== Natural-language search ==============

function NaturalLanguageSearch() {
  const draft = useWorkspaceStore((s) => s.inputDraft);
  const setDraft = useWorkspaceStore((s) => s.setInputDraft);
  const phase = useWorkspaceStore((s) => s.phase);
  const { send } = useConciergeStream();
  const [focused, setFocused] = useState(false);

  const isStreaming = phase === 'composing' || phase === 'shimmering' || phase === 'refining';

  const submit = () => {
    if (!draft.trim() || isStreaming) return;
    void send({ rawInput: draft, type: 'compose' });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ width: '100%', maxWidth: '38rem' }}
    >
      <div
        className="flex items-center gap-3 rounded-full px-5 py-3.5"
        style={{
          background: 'rgba(12, 12, 14, 0.88)',
          border: `1px solid ${
            focused ? 'var(--accent-primary)' : 'rgba(237,230,219,0.6)'
          }`,
          backdropFilter: 'blur(14px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <Sparkle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isStreaming}
          placeholder="Describe where you want to go..."
          aria-label="Describe where you want to go"
          className="flex-1 bg-transparent outline-none disabled:opacity-60"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            color: '#EDE6DB',
            letterSpacing: '0.005em',
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || isStreaming}
          aria-label="Submit search"
          style={{
            flexShrink: 0,
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '999px',
            border: 'none',
            background: draft.trim() && !isStreaming ? 'var(--accent-primary)' : 'rgba(237,230,219,0.18)',
            color: draft.trim() && !isStreaming ? '#1a1a1a' : 'rgba(237,230,219,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: draft.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            transition: 'background var(--dur-fast) var(--ease-out)',
          }}
        >
          <Send size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(237,230,219,0.55)',
            marginRight: '0.4rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Try
        </span>
        {[
          'Austria ski trip for 6 people',
          'Vancouver luxury weekend near restaurants',
          'Tokyo for a long weekend',
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setDraft(q);
              void send({ rawInput: q, type: 'compose' });
            }}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              background: 'rgba(12, 12, 14, 0.78)',
              border: '1px solid rgba(237,230,219,0.5)',
              color: '#EDE6DB',
              cursor: 'pointer',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </form>
  );
}

// ============== Discovery sections ==============

/**
 * Renders the four discovery rails (Trending now, Romantic escapes,
 * Luxury beach, Hidden gems) on a single dark canvas.
 *
 * Each rail's layout is governed by `DISCOVERY_SECTIONS[i].layout` so
 * a curator can re-shape the homepage by editing the dataset alone.
 */
function DiscoverySections() {
  return (
    <div
      className="relative z-10 w-full"
      style={{ background: 'var(--surface-base)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 pt-20 pb-12 md:gap-24">
        {DISCOVERY_SECTIONS.map((section) => (
          <DiscoveryRail key={section.slug} section={section} />
        ))}
      </div>
    </div>
  );
}

// ============== Live experience sections ==============

/**
 * Things-to-do rails powered by live partner inventory. Currently
 * three sections, each calling `/search/freetext` with a different
 * editorial term and rendering with a different layout.
 *
 * When the upstream experience provider isn't configured the rails
 * render their empty state silently rather than disappearing -
 * leaves space the visitor can come back to once we go live.
 */
const LIVE_EXPERIENCE_SECTIONS: readonly ExperienceRailSection[] = [
  {
    slug: 'live-things-to-do',
    eyebrow: 'Live · Things to do',
    title: "What's bookable right now.",
    subtitle:
      'Real inventory, real prices, real availability. Updates throughout the day as suppliers open and close their hold windows.',
    layout: 'carousel',
    query: 'private day tour',
  },
  {
    slug: 'live-food-and-wine',
    eyebrow: 'Live · Food & wine',
    title: 'Tables, tastings, and the people who run them.',
    subtitle:
      'Dinner-in-a-vineyard, sake brewery walks, evening market crawls with a chef who actually cooks for you.',
    layout: 'hero-rail',
    query: 'food wine tasting tour',
  },
  {
    slug: 'live-outdoors',
    eyebrow: 'Live · Outdoors',
    title: 'Mornings that start before the city does.',
    subtitle:
      'Hot-air balloons, glacier hikes, dawn snorkels. Small groups, instant confirmation, easy to add to a stay.',
    layout: 'grid',
    query: 'sunrise outdoor adventure',
  },
];

function LiveExperienceSections() {
  return (
    <div
      className="relative z-10 w-full"
      style={{ background: 'var(--surface-base)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 pt-12 pb-20 md:gap-24">
        {LIVE_EXPERIENCE_SECTIONS.map((section) => (
          <LiveExperiencesRail key={section.slug} section={section} />
        ))}
      </div>
    </div>
  );
}

// ============== Footer ==============

function LandingFooter() {
  return (
    <footer
      className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-2 pb-12"
      style={{
        background: 'var(--surface-base)',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.7rem',
        color: 'var(--ink-tertiary)',
        lineHeight: 1.55,
      }}
    >
      <div className="mx-auto max-w-3xl text-center">
        Affiliate links. Prices and availability come from our partners and may change. StayScout
        earns a small commission when you book through us; the price you pay is the same.
      </div>
    </footer>
  );
}

const chevronButtonStyle: CSSProperties = {
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(237,230,219,0.4)',
  color: '#EDE6DB',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

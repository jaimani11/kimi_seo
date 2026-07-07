'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Experience } from '@core/experience';
import { ChevronRight } from '@/features/shared/icons';
import { partnerProvenanceLine } from '@lib/branding/provider-branding';
import {
  ExperienceCardCompact,
  ExperienceCardHero,
  ExperienceCardStandard,
} from '@/features/experience-cards';

export type ExperienceRailLayout = 'carousel' | 'hero-rail' | 'grid';

export interface ExperienceRailSection {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  layout: ExperienceRailLayout;
  /** The search term Viator should be queried with. Surfaces the
   *  editorial framing - "private boat tours" reads differently from
   *  "yacht charter Mediterranean" even though they overlap. */
  query: string;
  /** Optional ISO-3166-1 country code to scope the search. */
  country?: string;
}

interface DiscoveryExperienceRailProps {
  section: ExperienceRailSection;
  /** Data state. Provider boundaries are explicit so the parent can
   *  switch between SSR (passing `experiences` directly) and
   *  client-side fetch (passing `loading` true while a request is
   *  in flight). */
  experiences: readonly Experience[];
  loading?: boolean;
  /** Error message to surface in the empty state. Keep it short -
   *  the rail title already names what failed. */
  error?: string | null;
}

/**
 * Live-experience rail. Same eyebrow / title / subtitle structure as
 * the curated property rails, but the body is provider-backed.
 *
 *   - `carousel`: horizontal scroller of compact cards
 *   - `hero-rail`: hero + 3-stack
 *   - `grid`: 3-column grid of standard cards
 *
 * (We don't ship an `editorial-slab` variant for experiences in H1 -
 *  the writeable headline/body inside the slab is curated copy that
 *  doesn't apply to API-backed sections.)
 *
 * When `loading`, the rail renders skeleton cards so the layout
 * doesn't pop in. On error or empty, the rail collapses to a single
 * gentle line of explanatory text - we never want to leave a hole.
 */
export function DiscoveryExperienceRail({
  section,
  experiences,
  loading = false,
  error = null,
}: DiscoveryExperienceRailProps) {
  const hasContent = experiences.length > 0;

  return (
    <section className="w-full">
      <RailHeader section={section} />

      {loading && !hasContent ? <RailSkeleton layout={section.layout} /> : null}
      {!loading && error ? <RailError message={error} /> : null}
      {!loading && !error && !hasContent ? <RailEmpty /> : null}

      {hasContent ? <RailBody layout={section.layout} experiences={experiences} /> : null}

      {hasContent ? <ProvenanceFooter /> : null}
    </section>
  );
}

/**
 * Calm provenance line at the bottom of every live rail. Replaces
 * the in-card brand chips that used to compete with the editorial
 * copy. Reads as a single quiet certainty.
 *
 * The line is routed through the branding layer - in neutral mode
 * (the current default), it reads "Live availability through our
 * partner. Refreshed continuously." In explicit mode it names the
 * partner. The text is generated per render so flipping
 * NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE takes effect on next paint.
 */
function ProvenanceFooter() {
  return (
    <p
      className="mt-6"
      style={{
        fontFamily: 'var(--font-fraunces)',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '0.78rem',
        color: 'var(--ink-tertiary)',
        lineHeight: 1.55,
        margin: '1.5rem 0 0',
      }}
    >
      {partnerProvenanceLine('viator')}
    </p>
  );
}

// ============== Header ==============

function RailHeader({ section }: { section: ExperienceRailSection }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="mb-8 flex max-w-2xl flex-col gap-2 md:mb-10"
    >
      <div
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.65rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
        }}
      >
        {section.eyebrow}
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {section.title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '0.95rem',
          fontStyle: 'italic',
          fontWeight: 300,
          lineHeight: 1.5,
          color: 'var(--ink-tertiary)',
          margin: 0,
          marginTop: '0.4rem',
        }}
      >
        {section.subtitle}
      </p>
    </motion.header>
  );
}

// ============== Body switcher ==============

function RailBody({
  layout,
  experiences,
}: {
  layout: ExperienceRailLayout;
  experiences: readonly Experience[];
}) {
  switch (layout) {
    case 'carousel':
      return <CarouselBody experiences={experiences} />;
    case 'hero-rail':
      return <HeroRailBody experiences={experiences} />;
    case 'grid':
      return <GridBody experiences={experiences} />;
  }
}

function CarouselBody({ experiences }: { experiences: readonly Experience[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [experiences.length]);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-card]');
    const step = firstCard ? firstCard.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 1.2, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative">
      <div className="hidden justify-end gap-2 pb-3 md:flex">
        <ArrowButton direction="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
        <ArrowButton direction="right" disabled={!canRight} onClick={() => scrollBy(1)} />
      </div>
      <div
        ref={scrollerRef}
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
      >
        {experiences.map((experience) => (
          <div
            key={experience.id}
            data-card
            className="w-[72vw] flex-shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw]"
          >
            <ExperienceCardCompact experience={experience} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroRailBody({ experiences }: { experiences: readonly Experience[] }) {
  const hero = experiences[0];
  const rest = experiences.slice(1, 4);
  if (!hero) return null;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div className="w-full">
        <ExperienceCardHero experience={hero} />
      </div>
      <div className="flex flex-col gap-4">
        {rest.map((e) => (
          <ExperienceCardStandard key={e.id} experience={e} />
        ))}
      </div>
    </div>
  );
}

function GridBody({ experiences }: { experiences: readonly Experience[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {experiences.slice(0, 6).map((e) => (
        <ExperienceCardStandard key={e.id} experience={e} dense />
      ))}
    </div>
  );
}

// ============== States ==============

function RailSkeleton({ layout }: { layout: ExperienceRailLayout }) {
  const count = layout === 'carousel' ? 5 : layout === 'grid' ? 6 : 4;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            aspectRatio: layout === 'carousel' ? '5/6' : '16/10',
            borderRadius: '0.95rem',
            border: '1px solid var(--border-subtle)',
            background:
              'linear-gradient(140deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      ))}
    </div>
  );
}

function RailEmpty() {
  return (
    <p
      style={{
        fontFamily: 'var(--font-fraunces)',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '0.95rem',
        color: 'var(--ink-tertiary)',
        margin: 0,
      }}
    >
      Nothing live in this slice today. Try the natural-language search above.
    </p>
  );
}

function RailError({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.85rem',
        color: 'var(--ink-tertiary)',
        margin: 0,
      }}
    >
      Live inventory paused for a moment ({message}). Refresh in a few seconds.
    </p>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '2.4rem',
        height: '2.4rem',
        borderRadius: '999px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-elevated)',
        color: 'var(--ink-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 200ms ease',
        padding: 0,
      }}
    >
      <ChevronRight
        size={15}
        strokeWidth={2.4}
        style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}
      />
    </button>
  );
}

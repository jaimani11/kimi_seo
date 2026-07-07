'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from '@/features/shared/icons';
import { PropertyCardCompact, type DiscoverySection } from '@/features/cards';
import { DiscoverySectionHeader } from './discovery-section-header';

interface DiscoveryCarouselProps {
  section: DiscoverySection;
}

/**
 * Horizontal-scroll rail used for high-density sections (Trending now,
 * What's-hot-this-month).
 *
 * Cards are laid out in a flex row inside a horizontally-scrollable
 * container. The user can:
 *   - drag (touch + trackpad)
 *   - scroll the wheel sideways (browser native on most platforms)
 *   - tap the chevron buttons (page-by-page)
 *   - tab through cards (each card is a focusable anchor)
 *
 * Snap behavior uses CSS `scroll-snap-type: x mandatory` so individual
 * cards align cleanly when the user pauses. The arrow buttons advance
 * by ~one card width per click, computed at runtime from the first
 * card's measured width (handles responsive sizing without hardcoding).
 */
export function DiscoveryCarousel({ section }: DiscoveryCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Recompute can-scroll-{left,right} after every scroll event so the
  // chevron buttons disable at the rail ends. Throttling with rAF
  // because scroll fires aggressively.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const onResize = () => update();
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [section.slug]);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-card]');
    const step = firstCard ? firstCard.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 1.2, behavior: 'smooth' });
  }, []);

  return (
    <section className="w-full">
      <DiscoverySectionHeader
        section={section}
        rightSlot={
          <div className="hidden items-center gap-2 md:flex">
            <CarouselArrowButton
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => scrollBy(-1)}
            />
            <CarouselArrowButton
              direction="right"
              disabled={!canScrollRight}
              onClick={() => scrollBy(1)}
            />
          </div>
        }
      />

      <div
        ref={scrollerRef}
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
      >
        {section.properties.map((property) => (
          <div
            key={property.id}
            data-card
            className="w-[72vw] flex-shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw]"
          >
            <PropertyCardCompact property={property} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CarouselArrowButton({
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
        transition: 'opacity 200ms ease, background 200ms ease',
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

'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SmartStayOffer — a stateless, cookieless intent-timed booking nudge; our own
 * take on Stay22's "Nova". It scores commercial intent in real time from
 * on-page behaviour — how far the reader has scrolled, how long they've dwelled,
 * and whether they're exit-intenting — and reveals ONE tasteful offer only once
 * that score crosses a threshold. So it never interrupts someone who's still
 * reading, and only appears when they look ready to act.
 *
 * Everything runs in the browser. No cookies, no network, nothing stored
 * server-side; the only persistence is a single sessionStorage flag so a reader
 * who dismisses it isn't nagged again that session.
 *
 * The algorithm (all client-side, per page view):
 *   intent = 0.55·maxScrollDepth + 0.45·min(1, dwellSeconds / 45)
 *   reveal when intent ≥ 0.6, OR scrolled past 70%, OR a genuine exit-intent
 *   (cursor leaves the top of the viewport after some engagement), OR 45s dwell.
 */

export interface SmartStayOfferProps {
  /** Tracked affiliate deep-link (built server-side, already brand-correct). */
  href: string;
  /** Short eyebrow, e.g. "Ready when you are". */
  eyebrow?: string;
  /** Headline — make it contextual, e.g. "Lock in where you'll stay in Rome". */
  headline: string;
  /** One supporting line, e.g. "Whole homes on VRBO — same price as direct." */
  subline: string;
  /** CTA label, e.g. "See homes →". */
  ctaLabel: string;
  /** Per-surface sessionStorage key so dismissals don't bleed across intents. */
  storageKey?: string;
  /** Optional analytics hook fired once when the offer is shown / clicked. */
  onEvent?: (event: 'shown' | 'clicked' | 'dismissed') => void;
}

export function SmartStayOffer({
  href,
  eyebrow = 'Ready when you are',
  headline,
  subline,
  ctaLabel,
  storageKey = 'smart-stay-offer',
  onEvent,
}: SmartStayOfferProps) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    // Respect a prior dismissal this session, and never show if there's no link.
    if (!href) return;
    try {
      if (sessionStorage.getItem(storageKey) === '1') return;
    } catch {
      /* private mode — fall through, just won't persist */
    }

    const start = Date.now();
    let maxScroll = 0;
    let raf = 0;

    const reveal = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      setVisible(true);
      onEvent?.('shown');
      // next frame → CSS transition runs from hidden → shown
      raf = requestAnimationFrame(() => setEntered(true));
    };

    const measure = () => {
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const depth = Math.min(1, Math.max(0, window.scrollY) / scrollable);
      if (depth > maxScroll) maxScroll = depth;
      const dwell = (Date.now() - start) / 1000;
      const intent = 0.55 * maxScroll + 0.45 * Math.min(1, dwell / 45);
      if (intent >= 0.6 || maxScroll >= 0.7) reveal();
    };

    const onScroll = () => measure();
    const onMouseOut = (e: MouseEvent) => {
      // Genuine exit-intent: cursor left the document via the top, after the
      // reader engaged at all. (relatedTarget null = left the window.)
      if (e.relatedTarget === null && e.clientY <= 0 && maxScroll >= 0.12) reveal();
    };
    const dwellTimer = window.setTimeout(() => {
      if (maxScroll >= 0.1) reveal();
    }, 45000);

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onMouseOut);
      window.clearTimeout(dwellTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [href, storageKey, onEvent]);

  const dismiss = () => {
    setEntered(false);
    onEvent?.('dismissed');
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    // let the exit transition play before unmounting
    window.setTimeout(() => setVisible(false), 220);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={headline}
      style={{
        position: 'fixed',
        zIndex: 60,
        right: 'clamp(0.75rem, 3vw, 1.5rem)',
        bottom: 'clamp(0.75rem, 3vw, 1.5rem)',
        left: 'auto',
        width: 'min(360px, calc(100vw - 1.5rem))',
        transform: entered ? 'translateY(0)' : 'translateY(14px)',
        opacity: entered ? 1 : 0,
        transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '1rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
          boxShadow: '0 18px 44px -14px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.08)',
          padding: '1.1rem 1.15rem 1.2rem',
          fontFamily: 'var(--font-inter)',
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: '0.55rem',
            right: '0.6rem',
            width: '1.6rem',
            height: '1.6rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '999px',
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-tertiary)',
            fontSize: '1.05rem',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <p
          style={{
            margin: 0,
            fontSize: '0.62rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          {eyebrow}
        </p>
        <p
          style={{
            margin: '0.35rem 0 0',
            fontSize: '1.02rem',
            fontWeight: 800,
            lineHeight: 1.25,
            color: 'var(--ink-primary)',
            paddingRight: '1rem',
          }}
        >
          {headline}
        </p>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--ink-secondary)' }}>
          {subline}
        </p>
        <a
          href={href}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          onClick={() => onEvent?.('clicked')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: '0.85rem',
            padding: '0.7rem 1rem',
            borderRadius: '0.7rem',
            background: 'var(--accent-primary)',
            color: 'var(--accent-on-primary, #fff)',
            fontSize: '0.92rem',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}

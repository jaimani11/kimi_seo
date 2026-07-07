'use client';

import { useState, useId } from 'react';

/**
 * Explainable "Why Viator?" tooltip. Surfaces next to any Reserve CTA.
 * Builds trust by stating the affiliate-economic truth plainly:
 *
 *   - Same price as booking direct on viator.com
 *   - Most experiences offer free cancellation
 *   - 24/7 Viator customer support
 *   - We earn a small commission; the site is free to use because of it
 *
 * Click-to-open on desktop, tap-to-open on mobile. No external network
 * calls. WCAG-correct: button has aria-expanded, popover has role=note.
 */
export function WhyViatorTooltip({
  align = 'right',
}: {
  /** Which side the popover anchors to (default right-aligned under the
   *  Reserve button). */
  align?: 'left' | 'right' | 'center';
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Why Viator?"
        onClick={() => setOpen((p) => !p)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 transition-opacity hover:opacity-80"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          letterSpacing: '0.06em',
          color: 'var(--ink-tertiary)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          textDecorationStyle: 'dotted',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Why Viator?
      </button>
      {open ? (
        <div
          id={id}
          role="note"
          className="absolute z-30 mt-1.5 w-72 rounded-xl border p-3"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-emphasis)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
            ...(align === 'right'
              ? { right: 0 }
              : align === 'left'
                ? { left: 0 }
                : { left: '50%', transform: 'translateX(-50%)' }),
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.6rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 600,
              margin: 0,
            }}
          >
            How this works
          </p>
          <ul
            className="mt-2 flex flex-col gap-1.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            <Row label="Price" value="Identical to Viator direct." />
            <Row label="Cancellation" value="Free on most experiences." />
            <Row label="Support" value="24/7, through Viator." />
            <Row label="Why us" value="We earn a small fee; that keeps this site free." />
          </ul>
        </div>
      ) : null}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="grid grid-cols-[5.2rem_1fr] gap-2">
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </li>
  );
}

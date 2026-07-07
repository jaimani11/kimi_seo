'use client';

import type { ReactNode } from 'react';
import { X } from '@/features/shared/icons';

interface DrawerChromeProps {
  titleId: string;
  onClose: () => void;
  /** Full-bleed hero photo block - the cinematic top of the drawer. */
  hero: ReactNode;
  /** Body content - editorial copy + metadata + CTA. */
  children: ReactNode;
  /** Footer disclosure copy. Defaults to the standard affiliate line. */
  disclosure?: string;
}

/**
 * Shared chrome for any marketplace drawer body. Caller provides the
 * hero photo block and the body content; this component owns:
 *
 *   - the close button (floating top-right)
 *   - the affiliate-link disclosure footer
 *   - the body's gutters + max-width
 *
 * Property and experience drawer bodies stay siblings rather than
 * collapsing into one because the content shapes differ - amenities
 * vs durations, room counts vs group sizes. They share the chrome,
 * not the body.
 */
export function DrawerChrome({
  titleId: _titleId,
  onClose,
  hero,
  children,
  disclosure = 'Affiliate link. Prices and availability come from our partner. The price you pay is the same.',
}: DrawerChromeProps) {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* Close button - floats above the hero. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          width: '2.2rem',
          height: '2.2rem',
          borderRadius: '999px',
          border: '1px solid rgba(237,230,219,0.32)',
          background: 'rgba(12,12,14,0.55)',
          color: '#EDE6DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          backdropFilter: 'blur(6px)',
        }}
      >
        <X size={14} strokeWidth={2.2} />
      </button>

      {hero}

      <div className="flex flex-1 flex-col gap-6 px-7 pt-7 pb-8 md:px-9 md:pt-9">
        {children}
      </div>

      <footer
        className="px-7 pb-10 md:px-9"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          lineHeight: 1.55,
          color: 'var(--ink-tertiary)',
        }}
      >
        {disclosure}
      </footer>
    </div>
  );
}

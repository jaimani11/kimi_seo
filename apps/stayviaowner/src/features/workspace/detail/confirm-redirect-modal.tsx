'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Stay } from '@core/stay';
import { ExternalLink } from '@/features/shared/icons';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';
import { generateGoUrl } from '@/lib/affiliate/go-url';

/**
 * Confirm + handoff modal for the booking redirect.
 *
 * The CTA is a real `<a>` whose href hits `/api/go` - the server records
 * the click and 302s to the provider's deep link. target=_blank means
 * the user keeps StayScout in the original tab.
 *
 * Wording leans on the existing voice rule: italic Fraunces, no
 * exclamations, no "discover/journey/unforgettable."
 */
export function ConfirmRedirectModal({
  open,
  onClose,
  stay,
  turnId,
}: {
  open: boolean;
  onClose: () => void;
  stay: Stay;
  turnId?: string;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const goHref = generateGoUrl({ stay, ...(turnId ? { turnId } : {}) });
  const providerHost = (() => {
    try {
      return new URL(stay.bookingLink.url).hostname.replace(/^www\./, '');
    } catch {
      return 'the provider';
    }
  })();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.25 }}
          className="fixed inset-0 z-50 grid place-items-center px-6"
          style={{ background: 'rgba(11, 13, 16, 0.78)' }}
          onClick={onClose}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-[18px] border p-5"
            style={{
              background: 'var(--surface-raised)',
              borderColor: 'var(--border-emphasis)',
              boxShadow: 'var(--elev-hero)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
              }}
            >
              Booking handoff
            </p>
            <h3
              className="mt-1 mb-2"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-display-sm)',
                fontWeight: 400,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Continuing to {providerHost}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-body-sm)',
                fontStyle: 'italic',
                color: 'var(--ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              {stay.name} books through {providerHost}. Prices are identical; StayScout earns a
              small affiliate commission on completed bookings - that&apos;s how the concierge stays
              free.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={goHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#14171C',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                Continue to {providerHost}
                <ExternalLink size={14} strokeWidth={2.2} />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-full border px-4 py-2.5 transition-colors hover:bg-[color:var(--surface-overlay)]"
                style={{
                  borderColor: 'var(--border-emphasis)',
                  color: 'var(--ink-primary)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                Stay here
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

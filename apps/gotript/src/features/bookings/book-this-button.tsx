'use client';

import { useState } from 'react';
import type { SavedTripRow as SavedTripRowData } from '../workspace/hooks/use-saved-trips';
import { ArrowRight } from '@/features/shared/icons';
import { BookingDraftModal } from './booking-draft-modal';

interface BookThisButtonProps {
  trip: SavedTripRowData;
}

/**
 * "BOOK THIS →" link in the saved-trip row footer. Opens the approval
 * modal which calls /api/bookings/draft + lets the user confirm.
 *
 * Lives next to the "PLAN DAY-BY-DAY →" link (Slice C3) without
 * conflicting - same `data-row-action` attribute keeps the click from
 * bubbling to the row's resurface handler.
 */
export function BookThisButton({ trip }: BookThisButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-row-action
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 transition-colors hover:text-[color:var(--accent-primary)]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-secondary)',
          fontWeight: 500,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Book this
        <ArrowRight size={11} strokeWidth={2.2} />
      </button>
      {open && <BookingDraftModal trip={trip} onClose={() => setOpen(false)} />}
    </>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { ArrowRight } from '@/features/shared/icons';
import { track } from '@/lib/analytics/client';

/**
 * "Reserve all" button. Sequentially opens every `/r/[id]` reserve
 * link on the page in a new tab so the user can complete each
 * reservation on Viator without losing their plan.
 *
 * The browser blocks `window.open` calls that aren't directly tied to
 * a user gesture, so we open them in a tight loop on the same click
 * and let Viator handle queueing — most browsers permit ~5–8
 * concurrent tab opens per click; we cap at 7 and surface a note if
 * there are more.
 *
 * The "reserve" hrefs are read from the DOM via `[data-plan-reserve]`
 * so this button stays decoupled from the day rendering — anything
 * with that attribute participates, in document order.
 */
export function ReserveAllButton({ totalPicks }: { totalPicks: number }) {
  const [reserving, setReserving] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);

  const handleClick = useCallback(() => {
    if (typeof document === 'undefined') return;
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[data-plan-reserve]'),
    );
    if (anchors.length === 0) return;
    setReserving(true);

    const max = Math.min(7, anchors.length);
    let actuallyOpened = 0;
    for (let i = 0; i < max; i++) {
      const a = anchors[i];
      if (!a) continue;
      const win = window.open(a.href, '_blank', 'noopener,noreferrer');
      if (win) actuallyOpened++;
    }
    setOpened(actuallyOpened);
    track('plan_reserve_all', { totalPicks, openedCount: actuallyOpened });

    // Reset visual state after a beat so the user can click again
    // (e.g. after dismissing the popup-blocker prompt).
    window.setTimeout(() => setReserving(false), 2200);
  }, [totalPicks]);

  if (totalPicks === 0) return null;

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={reserving}
        className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 transition-all hover:translate-y-[-1px]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.82rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: 'var(--accent-primary)',
          color: '#1a1a1a',
          border: 'none',
          cursor: reserving ? 'wait' : 'pointer',
        }}
      >
        {reserving ? 'Opening tabs…' : `Reserve all ${totalPicks} on Viator`}
        <ArrowRight size={13} strokeWidth={2.4} />
      </button>
      {opened !== null ? (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            color: 'var(--ink-tertiary)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {opened === totalPicks
            ? `${opened} tabs opened — finish each reservation on Viator.`
            : `${opened} of ${totalPicks} tabs opened (browser limit). Reserve the rest individually.`}
        </p>
      ) : (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            color: 'var(--ink-tertiary)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Opens each reservation in a new tab — same price as direct.
        </p>
      )}
    </div>
  );
}

'use client';

import { Bookmark } from '@/features/shared/icons';
import { useWorkspaceStore } from '../store/workspace-store';
import { useSavedTrips } from '../hooks/use-saved-trips';

/**
 * Header affordance for opening the saved-trips panel. Always visible -
 * shows a count badge once there is at least one saved trip. Anonymous
 * sessions can save trips without signing in (B1 default), so the count
 * is meaningful even pre-auth.
 */
export function SavedHeaderButton() {
  const open = useWorkspaceStore((s) => s.openSavedPanel);
  const { trips } = useSavedTrips();
  const count = trips.length;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count > 0 ? `Saved trips (${count})` : 'Saved trips'}
      className="relative grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--ink-secondary)',
      }}
    >
      <Bookmark size={14} strokeWidth={1.8} />
      {count > 0 ? (
        <span
          className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.55rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

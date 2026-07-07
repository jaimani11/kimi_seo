'use client';

import { Bookmark, BookmarkCheck } from '@/features/shared/icons';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

export function PinButton({
  stayId,
  variant = 'overlay',
}: {
  stayId: string;
  variant?: 'overlay' | 'inline';
}) {
  const compareSet = useWorkspaceStore((s) => s.compareSet);
  const pinStay = useWorkspaceStore((s) => s.pinStay);
  const unpinStay = useWorkspaceStore((s) => s.unpinStay);
  const isPinned = compareSet.includes(stayId);
  const Icon = isPinned ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      aria-label={isPinned ? 'Unpin from compare' : 'Pin to compare'}
      onClick={(e) => {
        e.stopPropagation();
        if (isPinned) unpinStay(stayId);
        else pinStay(stayId);
      }}
      className="grid h-8 w-8 place-items-center rounded-full backdrop-blur-[10px] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[rgba(0,0,0,0.42)]"
      style={{
        background: variant === 'overlay' ? 'rgba(0,0,0,0.32)' : 'var(--surface-overlay)',
        color: isPinned ? 'var(--accent-primary)' : '#EDE6DB',
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <Icon size={14} strokeWidth={1.8} />
    </button>
  );
}

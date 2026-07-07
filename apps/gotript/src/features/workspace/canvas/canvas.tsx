'use client';

import { useWorkspaceStore } from '../store/workspace-store';
import { selectCurrentTurn } from '../store/derived';
import { EmptyState } from './empty-state';
import { ShimmerPlaceholder } from './shimmer-placeholder';
import { TripBoard } from './trip-board/trip-board';
import { SearchOpportunityBoard } from './search-opportunity-board/search-opportunity-board';
import { CompareTray } from './compare-tray';
import { DetailPanel } from '../detail/detail-panel';

export function Canvas() {
  const phase = useWorkspaceStore((s) => s.phase);
  const turn = useWorkspaceStore((s) => selectCurrentTurn(s));

  return (
    <div className="relative h-full">
      {renderContent()}
      <CompareTray />
      <DetailPanel />
    </div>
  );

  function renderContent() {
    if (phase === 'idle' || !turn) return <EmptyState />;
    // Slice F1 - opportunity boards render whenever the turn has one,
    // even while later streaming events are still arriving. Skeleton
    // never lingers waiting on a `proposal.ready` that won't come.
    if (turn.searchOpportunity) {
      return <SearchOpportunityBoard opportunity={turn.searchOpportunity} />;
    }
    if (phase === 'shimmering') return <ShimmerPlaceholder />;
    if (turn.proposal) {
      return <TripBoard proposal={turn.proposal} adaptationNotes={turn.adaptationNotes} />;
    }
    if (phase === 'refining') return <ShimmerPlaceholder />;
    return <EmptyState />;
  }
}

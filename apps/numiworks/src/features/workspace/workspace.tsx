'use client';

import { Suspense } from 'react';
import { Header } from '@/features/landing/header';
import { ChatSidebar } from './chat-sidebar/chat-sidebar';
import { Canvas } from './canvas/canvas';
import { SavedTripsPanel } from './saved-trips/saved-trips-panel';
import { UrlInit } from './url-init';
import { MobileBottomSheet } from './mobile-bottom-sheet';
import { LandingPage } from './landing/landing-page';
import { useWorkspaceStore } from './store/workspace-store';
import { selectCurrentTurnHasResults } from './store/derived';
import { useIsMobile } from '@/features/shared/use-media-query';

/**
 * Single-screen workspace shell.
 *
 *   Pre-submission (no turns): bedroomvillas-style LandingPage.
 *     A full-bleed photo carousel with a centered "Describe where you
 *     want to go..." input bar; featured destinations grid below.
 *
 *   Post-submission (≥1 turn):
 *     Desktop (≥768px) - split chat (38%) + canvas (62%).
 *     Mobile  (<768px) - canvas full-screen; chat in a draggable bottom
 *     sheet with peek/half/full snaps.
 *
 * The two post-submission layouts are switched via media-query state,
 * NOT CSS classes, because the mobile sheet needs JS-driven drag +
 * viewport measurement. SSR + first-paint render the desktop layout;
 * mobile flips post-mount via useIsMobile (which is SSR-safe → false).
 */
export function Workspace() {
  const isMobile = useIsMobile();
  const hasTurns = useWorkspaceStore((s) => s.turns.length > 0);
  const hasResults = useWorkspaceStore(selectCurrentTurnHasResults);

  return (
    <div className="flex h-screen flex-col">
      {/* useSearchParams is gated behind Suspense per Next 16's CSR rules. */}
      <Suspense fallback={null}>
        <UrlInit />
      </Suspense>
      <Header />

      {!hasTurns ? (
        // First-impression landing page. Once the user submits a trip
        // (a turn appears in the store), the workspace below takes over.
        <main className="relative min-h-0 flex-1">
          <LandingPage />
        </main>
      ) : isMobile ? (
        // Mobile shell: canvas owns the full viewport; chat is a sheet
        // anchored to the bottom edge.
        <main className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <Canvas />
          </div>
          <MobileBottomSheet>
            <ChatSidebar />
          </MobileBottomSheet>
        </main>
      ) : !hasResults ? (
        // Streaming - AI is still thinking, no proposal/opportunity yet.
        // Chat takes the full width so the agent steps + thinking states
        // are the focus. The chat sidebar's max-width caps the content
        // around 720px and centers it, mirroring a real conversation
        // view. Once the orchestrator emits a proposal.ready or
        // search.opportunity.ready event, hasResults flips true and the
        // shell smoothly collapses to the split layout below.
        <main className="relative min-h-0 flex-1">
          <div className="mx-auto h-full w-full max-w-3xl">
            <ChatSidebar />
          </div>
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-[38%_62%]">
          <div className="min-h-0 border-r" style={{ borderColor: 'var(--border-subtle)' }}>
            <ChatSidebar />
          </div>
          <section className="relative min-h-0">
            <Canvas />
          </section>
        </main>
      )}

      <SavedTripsPanel />
    </div>
  );
}

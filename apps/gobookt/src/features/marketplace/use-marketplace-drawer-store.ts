'use client';

import { create } from 'zustand';
import type { Experience } from '@core/experience';
import type { Property } from '@lib/discovery/property';

/**
 * Global drawer state for the hybrid booking flow.
 *
 * Hero / standard / editorial cards trigger the drawer; compact
 * carousel cards still hand off directly. The drawer is the
 * storytelling moment - bigger photo, the editorial pull at full
 * size, the metadata the cards intentionally don't carry on their
 * surface (cancellation, duration, group size, etc.), and only
 * after all that the partner hand-off.
 *
 * One drawer host is mounted at the app root; any card on any page
 * can open it via `useMarketplaceDrawerStore.getState().open(...)`.
 */

export type MarketplaceDrawerItem =
  | { kind: 'property'; property: Property }
  | { kind: 'experience'; experience: Experience };

interface MarketplaceDrawerState {
  item: MarketplaceDrawerItem | null;
  open: (item: MarketplaceDrawerItem) => void;
  close: () => void;
}

export const useMarketplaceDrawerStore = create<MarketplaceDrawerState>((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
}));

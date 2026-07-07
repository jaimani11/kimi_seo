import {
  CuratedItineraryGenerator,
  SynthesizedItineraryGenerator,
  type ItineraryGenerator,
} from './generator';
import { getInMemoryItineraryStore } from './in-memory-itinerary-store';
import type { ItineraryStore } from './itinerary-store';

export interface ItinerarySubsystem {
  store: ItineraryStore;
  generator: ItineraryGenerator;
  /** Surfaced via getServerFeatures() - `curated` (default), `model`
   *  when C3.x ships ModelItineraryGenerator. */
  kind: 'curated' | 'model';
}

// Process-global anchor - see comment in src/lib/session/factory.ts.
declare global {
  var __stayscoutItinerarySubsystem: ItinerarySubsystem | undefined;
}

export function getItinerarySubsystem(): ItinerarySubsystem {
  if (globalThis.__stayscoutItinerarySubsystem) return globalThis.__stayscoutItinerarySubsystem;
  const store = getInMemoryItineraryStore();
  const synthesized = new SynthesizedItineraryGenerator();
  const generator = new CuratedItineraryGenerator(synthesized);
  globalThis.__stayscoutItinerarySubsystem = { store, generator, kind: 'curated' };
  return globalThis.__stayscoutItinerarySubsystem;
}

export function _resetItinerarySubsystemForTesting(): void {
  globalThis.__stayscoutItinerarySubsystem = undefined;
}

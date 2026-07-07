import type { MoodSnapshot } from '@core/reasoning';

// Editorial-tone, hand-written. One per destination. Tested against the
// BANNED_WORDS list in tests/seed.test.ts.

export const CURATED_MOODS: Readonly<Record<string, MoodSnapshot>> = {
  tuscany: {
    destinationName: 'Tuscany',
    text: 'Golden-hour vineyard dinners and slower mornings. The kind of place that makes you forget you have email.',
    source: 'curated',
    confidence: 1,
  },
  umbria: {
    destinationName: 'Umbria',
    text: 'Stone hill towns, deep olive groves, and Sundays that stretch into Mondays.',
    source: 'curated',
    confidence: 1,
  },
  amalfi: {
    destinationName: 'Amalfi Coast',
    text: 'Lemon groves clinging to cliffs, sea-glass water, and dinners that stretch past midnight.',
    source: 'curated',
    confidence: 1,
  },
  rome: {
    destinationName: 'Rome',
    text: 'Espresso at sunrise, ruins on the walk home, a city that wears its centuries lightly.',
    source: 'curated',
    confidence: 1,
  },
  venice: {
    destinationName: 'Venice',
    text: 'Footsteps echo on stone, gondolas trace shadows, mornings smell like the sea.',
    source: 'curated',
    confidence: 1,
  },
  'lake-como': {
    destinationName: 'Lake Como',
    text: 'Cypress-lined lakeshore, mist on the water at dawn, the slow theatre of mountains and light.',
    source: 'curated',
    confidence: 1,
  },
  'cinque-terre': {
    destinationName: 'Cinque Terre',
    text: 'Pastel houses stitched into cliffs, salt in the air, trains that arrive when they arrive.',
    source: 'curated',
    confidence: 1,
  },
};

export function getCuratedMood(slug: string): MoodSnapshot | null {
  return CURATED_MOODS[slug] ?? null;
}

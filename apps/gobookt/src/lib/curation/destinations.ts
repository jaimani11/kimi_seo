// Canonical metadata for the seven hand-curated Italian destinations.
//
// Used by:
//   - the /destinations/[slug] + /destinations index routes (editorial
//     copy + slug-to-name resolution),
//   - MoodSnapshotAgent (A6) for keying mood data,
//   - sitemap generation,
//   - the destination-extraction fallback.
//
// Slice H2 removed MockItalyProvider, but this curation file outlasted
// it - the editorial metadata is the durable layer. New destinations
// land here whenever we have voice/mood content for them.

export interface CuratedDestination {
  slug: string;
  name: string;
  country: 'IT';
  region: string;
  aliases: readonly string[];
  coordinates: { lat: number; lng: number };
  /** Short Fraunces-italic fragment, ~5–8 words. Used in the page hero. */
  headline: string;
  /** Single sentence, ~12–18 words. Used in cards, OG description, JSON-LD. */
  oneLiner: string;
}

export const ITALIAN_DESTINATIONS: readonly CuratedDestination[] = [
  {
    slug: 'tuscany',
    name: 'Tuscany',
    country: 'IT',
    region: 'Tuscany',
    aliases: ['florence', 'siena', 'chianti', "val d'orcia", 'pienza', 'montalcino'],
    coordinates: { lat: 43.7711, lng: 11.2486 },
    headline: 'Cypress lanes and slower mornings.',
    oneLiner:
      'Stone farmhouses, vineyard dinners, and a pace that lets the afternoon stretch into evening.',
  },
  {
    slug: 'umbria',
    name: 'Umbria',
    country: 'IT',
    region: 'Umbria',
    aliases: ['perugia', 'assisi', 'orvieto', 'spello', 'todi'],
    coordinates: { lat: 43.0978, lng: 12.5419 },
    headline: 'Hill towns and olive light.',
    oneLiner: 'Stone villages on green ridges, fewer crowds than Tuscany, Sundays that drift past.',
  },
  {
    slug: 'amalfi',
    name: 'Amalfi Coast',
    country: 'IT',
    region: 'Campania',
    aliases: ['positano', 'ravello', 'capri', 'sorrento', 'amalfi'],
    coordinates: { lat: 40.634, lng: 14.6027 },
    headline: 'Cliffs, lemons, sea-glass water.',
    oneLiner:
      'Pastel houses tumbling toward the sea, lemon groves overhead, dinners that stretch past midnight.',
  },
  {
    slug: 'rome',
    name: 'Rome',
    country: 'IT',
    region: 'Lazio',
    aliases: ['roma', 'trastevere', 'monti', 'prati'],
    coordinates: { lat: 41.9028, lng: 12.4964 },
    headline: 'A city that wears centuries lightly.',
    oneLiner:
      'Espresso at sunrise, ruins on the walk home, neighborhoods that change tempo every few blocks.',
  },
  {
    slug: 'venice',
    name: 'Venice',
    country: 'IT',
    region: 'Veneto',
    aliases: ['venezia', 'cannaregio', 'dorsoduro', 'san marco'],
    coordinates: { lat: 45.4408, lng: 12.3155 },
    headline: 'Footsteps on stone, mornings of salt.',
    oneLiner:
      'Quiet canals at dawn, gondolas tracing shadows, a city where every wrong turn is the right one.',
  },
  {
    slug: 'lake-como',
    name: 'Lake Como',
    country: 'IT',
    region: 'Lombardy',
    aliases: ['como', 'bellagio', 'tremezzo', 'varenna', 'lago di como'],
    coordinates: { lat: 45.9866, lng: 9.2531 },
    headline: 'Cypress shoreline, mountain light.',
    oneLiner:
      'Cypress-lined lakeshore, mist rising off the water at dawn, slow boats between fishing villages.',
  },
  {
    slug: 'cinque-terre',
    name: 'Cinque Terre',
    country: 'IT',
    region: 'Liguria',
    aliases: ['monterosso', 'vernazza', 'corniglia', 'manarola', 'riomaggiore'],
    coordinates: { lat: 44.1234, lng: 9.7081 },
    headline: 'Five villages stitched into cliffs.',
    oneLiner:
      'Pastel houses stacked above the Ligurian Sea, paths between them, suppers of pesto and white wine.',
  },
] as const;

export function findDestinationBySlugOrAlias(input: string): CuratedDestination | null {
  const needle = input.trim().toLowerCase();
  for (const d of ITALIAN_DESTINATIONS) {
    if (d.slug === needle) return d;
    if (d.name.toLowerCase() === needle) return d;
    if (d.aliases.includes(needle)) return d;
  }
  return null;
}

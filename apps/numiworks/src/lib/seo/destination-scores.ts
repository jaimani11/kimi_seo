/**
 * Destination Intelligence Scores.
 *
 * Eight dimensions per city, each 0-10. Rendered as a compact
 * scorecard on `/destinations/{slug}`. Also read by the AI
 * "Where should I go?" quiz to match traveler preferences to
 * destinations.
 *
 * Scoring guidance:
 *
 *   family        — kid-friendly attractions, safety, walkability
 *                   for strollers, family-friendly food scene
 *   romance       — scenery, sunsets, cozy dining, couple activities
 *   luxury        — 5-star hotels, michelin dining, private tours,
 *                   high-end shopping
 *   budget        — how far a budget traveler's dollar stretches
 *                   (10 = cheapest — Bangkok, Vietnam; 3 = Zurich)
 *   nightlife     — bars, clubs, late-night music scene
 *   food          — dining scene quality + diversity + street food
 *   walkability   — compact city center, pedestrian-friendly streets
 *   digitalNomad  — wifi speed, coffee shops, coworking density,
 *                   nomad community, cost + visa friendliness
 *
 * Scoring is deliberately editorial (not algorithmic) — a lived
 * assessment reads better than a synthesized number and is hard to
 * copy at scale. Missing entries render no scorecard on the page.
 */

export interface DestinationScores {
  family: number;
  romance: number;
  luxury: number;
  budget: number;
  nightlife: number;
  food: number;
  walkability: number;
  digitalNomad: number;
}

export const SCORE_DIMENSIONS: ReadonlyArray<{
  key: keyof DestinationScores;
  label: string;
  blurb: string;
  emoji: string;
}> = [
  { key: 'family', label: 'Family', blurb: 'Kid-friendly, safe, stroller-easy', emoji: '👨‍👩‍👧' },
  { key: 'romance', label: 'Romance', blurb: 'Scenic, cozy dining, sunsets', emoji: '💛' },
  { key: 'luxury', label: 'Luxury', blurb: 'Five-star hotels + fine dining', emoji: '💎' },
  { key: 'budget', label: 'Budget', blurb: 'Value per dollar (10 = cheapest)', emoji: '💵' },
  { key: 'nightlife', label: 'Nightlife', blurb: 'Bars, clubs, late scene', emoji: '🌃' },
  { key: 'food', label: 'Food', blurb: 'Dining depth + diversity', emoji: '🍜' },
  { key: 'walkability', label: 'Walkable', blurb: 'Compact + pedestrian-friendly', emoji: '🚶' },
  { key: 'digitalNomad', label: 'Digital nomad', blurb: 'Wifi, cafés, community', emoji: '💻' },
];

export const DESTINATION_SCORES: Readonly<Record<string, DestinationScores>> = {
  // ── Asia ────────────────────────────────────────────────────────
  tokyo:       { family: 9, romance: 8, luxury: 10, budget: 5, nightlife: 10, food: 10, walkability: 8, digitalNomad: 7 },
  kyoto:       { family: 8, romance: 10, luxury: 9, budget: 5, nightlife: 5, food: 9, walkability: 9, digitalNomad: 6 },
  osaka:       { family: 8, romance: 7, luxury: 8, budget: 6, nightlife: 9, food: 10, walkability: 8, digitalNomad: 6 },
  kanazawa:    { family: 7, romance: 9, luxury: 8, budget: 7, nightlife: 4, food: 8, walkability: 9, digitalNomad: 5 },
  fukuoka:     { family: 8, romance: 7, luxury: 7, budget: 7, nightlife: 8, food: 9, walkability: 9, digitalNomad: 7 },
  seoul:       { family: 8, romance: 7, luxury: 9, budget: 6, nightlife: 10, food: 10, walkability: 8, digitalNomad: 8 },
  bangkok:     { family: 6, romance: 6, luxury: 9, budget: 10, nightlife: 10, food: 10, walkability: 5, digitalNomad: 9 },
  'chiang-mai': { family: 7, romance: 8, luxury: 6, budget: 10, nightlife: 6, food: 9, walkability: 7, digitalNomad: 10 },
  bali:        { family: 7, romance: 10, luxury: 9, budget: 8, nightlife: 8, food: 8, walkability: 4, digitalNomad: 10 },
  singapore:   { family: 10, romance: 8, luxury: 10, budget: 3, nightlife: 8, food: 10, walkability: 9, digitalNomad: 8 },
  'hong-kong': { family: 8, romance: 8, luxury: 10, budget: 4, nightlife: 9, food: 10, walkability: 9, digitalNomad: 8 },
  taipei:      { family: 8, romance: 7, luxury: 7, budget: 8, nightlife: 8, food: 10, walkability: 9, digitalNomad: 9 },
  'ho-chi-minh-city': { family: 6, romance: 5, luxury: 6, budget: 10, nightlife: 9, food: 10, walkability: 5, digitalNomad: 9 },
  hanoi:       { family: 6, romance: 7, luxury: 6, budget: 10, nightlife: 7, food: 10, walkability: 6, digitalNomad: 8 },
  'el-nido':   { family: 7, romance: 10, luxury: 7, budget: 8, nightlife: 5, food: 6, walkability: 5, digitalNomad: 5 },
  jodhpur:     { family: 6, romance: 9, luxury: 8, budget: 9, nightlife: 3, food: 8, walkability: 7, digitalNomad: 4 },
  udaipur:     { family: 6, romance: 10, luxury: 9, budget: 9, nightlife: 3, food: 8, walkability: 7, digitalNomad: 4 },
  jaipur:      { family: 6, romance: 8, luxury: 8, budget: 9, nightlife: 3, food: 8, walkability: 5, digitalNomad: 4 },
  delhi:       { family: 5, romance: 5, luxury: 8, budget: 9, nightlife: 7, food: 10, walkability: 4, digitalNomad: 5 },
  mumbai:      { family: 6, romance: 7, luxury: 9, budget: 8, nightlife: 9, food: 10, walkability: 5, digitalNomad: 7 },
  kathmandu:   { family: 5, romance: 6, luxury: 5, budget: 10, nightlife: 5, food: 7, walkability: 5, digitalNomad: 6 },
  'siem-reap': { family: 7, romance: 8, luxury: 8, budget: 10, nightlife: 6, food: 8, walkability: 6, digitalNomad: 7 },

  // ── Europe ──────────────────────────────────────────────────────
  paris:       { family: 8, romance: 10, luxury: 10, budget: 4, nightlife: 8, food: 10, walkability: 10, digitalNomad: 7 },
  london:      { family: 8, romance: 7, luxury: 10, budget: 3, nightlife: 9, food: 9, walkability: 8, digitalNomad: 7 },
  rome:        { family: 8, romance: 10, luxury: 9, budget: 5, nightlife: 7, food: 10, walkability: 9, digitalNomad: 6 },
  florence:    { family: 7, romance: 10, luxury: 9, budget: 5, nightlife: 6, food: 10, walkability: 10, digitalNomad: 6 },
  venice:      { family: 7, romance: 10, luxury: 10, budget: 3, nightlife: 5, food: 8, walkability: 10, digitalNomad: 4 },
  barcelona:   { family: 8, romance: 9, luxury: 8, budget: 6, nightlife: 10, food: 10, walkability: 9, digitalNomad: 9 },
  madrid:      { family: 7, romance: 8, luxury: 8, budget: 6, nightlife: 10, food: 10, walkability: 8, digitalNomad: 8 },
  seville:     { family: 7, romance: 10, luxury: 7, budget: 7, nightlife: 8, food: 9, walkability: 9, digitalNomad: 6 },
  lisbon:      { family: 8, romance: 9, luxury: 7, budget: 7, nightlife: 8, food: 9, walkability: 8, digitalNomad: 10 },
  porto:       { family: 7, romance: 9, luxury: 6, budget: 8, nightlife: 7, food: 9, walkability: 9, digitalNomad: 9 },
  amsterdam:   { family: 9, romance: 8, luxury: 8, budget: 5, nightlife: 9, food: 8, walkability: 10, digitalNomad: 8 },
  berlin:      { family: 7, romance: 6, luxury: 7, budget: 6, nightlife: 10, food: 8, walkability: 8, digitalNomad: 9 },
  vienna:      { family: 8, romance: 9, luxury: 9, budget: 5, nightlife: 6, food: 8, walkability: 9, digitalNomad: 7 },
  prague:      { family: 7, romance: 9, luxury: 7, budget: 7, nightlife: 8, food: 8, walkability: 9, digitalNomad: 8 },
  budapest:    { family: 7, romance: 9, luxury: 7, budget: 8, nightlife: 10, food: 8, walkability: 8, digitalNomad: 9 },
  krakow:      { family: 7, romance: 8, luxury: 6, budget: 9, nightlife: 8, food: 8, walkability: 9, digitalNomad: 8 },
  copenhagen:  { family: 10, romance: 8, luxury: 8, budget: 3, nightlife: 8, food: 9, walkability: 10, digitalNomad: 8 },
  stockholm:   { family: 9, romance: 7, luxury: 8, budget: 3, nightlife: 8, food: 8, walkability: 9, digitalNomad: 8 },
  reykjavik:   { family: 8, romance: 9, luxury: 7, budget: 2, nightlife: 8, food: 7, walkability: 8, digitalNomad: 6 },
  dublin:      { family: 7, romance: 7, luxury: 7, budget: 4, nightlife: 10, food: 7, walkability: 8, digitalNomad: 7 },
  edinburgh:   { family: 8, romance: 9, luxury: 7, budget: 5, nightlife: 7, food: 7, walkability: 9, digitalNomad: 7 },
  santorini:   { family: 6, romance: 10, luxury: 10, budget: 4, nightlife: 6, food: 8, walkability: 6, digitalNomad: 5 },
  mykonos:     { family: 5, romance: 9, luxury: 10, budget: 3, nightlife: 10, food: 8, walkability: 6, digitalNomad: 5 },
  athens:      { family: 7, romance: 8, luxury: 7, budget: 7, nightlife: 8, food: 9, walkability: 8, digitalNomad: 8 },
  rhodes:      { family: 8, romance: 8, luxury: 7, budget: 7, nightlife: 7, food: 8, walkability: 7, digitalNomad: 6 },
  corfu:       { family: 8, romance: 8, luxury: 7, budget: 7, nightlife: 7, food: 8, walkability: 7, digitalNomad: 6 },
  crete:       { family: 8, romance: 9, luxury: 7, budget: 7, nightlife: 7, food: 9, walkability: 6, digitalNomad: 6 },
  dubrovnik:   { family: 7, romance: 10, luxury: 9, budget: 4, nightlife: 7, food: 7, walkability: 9, digitalNomad: 6 },
  split:       { family: 7, romance: 9, luxury: 7, budget: 6, nightlife: 8, food: 8, walkability: 8, digitalNomad: 7 },
  bucharest:   { family: 6, romance: 6, luxury: 6, budget: 9, nightlife: 9, food: 8, walkability: 7, digitalNomad: 9 },
  istanbul:    { family: 7, romance: 9, luxury: 8, budget: 7, nightlife: 8, food: 10, walkability: 8, digitalNomad: 8 },
  cappadocia:  { family: 7, romance: 10, luxury: 8, budget: 7, nightlife: 5, food: 7, walkability: 5, digitalNomad: 5 },
  zurich:      { family: 8, romance: 8, luxury: 10, budget: 2, nightlife: 6, food: 8, walkability: 9, digitalNomad: 7 },
  interlaken:  { family: 9, romance: 10, luxury: 8, budget: 3, nightlife: 4, food: 6, walkability: 7, digitalNomad: 5 },

  // ── Americas ────────────────────────────────────────────────────
  'new-york':      { family: 9, romance: 8, luxury: 10, budget: 3, nightlife: 10, food: 10, walkability: 9, digitalNomad: 6 },
  'los-angeles':   { family: 8, romance: 7, luxury: 9, budget: 4, nightlife: 9, food: 10, walkability: 3, digitalNomad: 7 },
  'san-francisco': { family: 8, romance: 8, luxury: 9, budget: 3, nightlife: 8, food: 9, walkability: 8, digitalNomad: 7 },
  chicago:         { family: 8, romance: 7, luxury: 9, budget: 5, nightlife: 9, food: 10, walkability: 8, digitalNomad: 7 },
  miami:           { family: 8, romance: 8, luxury: 10, budget: 4, nightlife: 10, food: 9, walkability: 6, digitalNomad: 7 },
  'new-orleans':   { family: 7, romance: 8, luxury: 8, budget: 6, nightlife: 10, food: 10, walkability: 8, digitalNomad: 6 },
  austin:          { family: 8, romance: 6, luxury: 7, budget: 6, nightlife: 9, food: 9, walkability: 6, digitalNomad: 9 },
  nashville:       { family: 7, romance: 6, luxury: 7, budget: 6, nightlife: 10, food: 8, walkability: 7, digitalNomad: 7 },
  'washington-dc': { family: 9, romance: 7, luxury: 8, budget: 5, nightlife: 8, food: 8, walkability: 8, digitalNomad: 7 },
  boston:          { family: 8, romance: 7, luxury: 8, budget: 4, nightlife: 8, food: 8, walkability: 8, digitalNomad: 7 },
  seattle:         { family: 8, romance: 7, luxury: 8, budget: 5, nightlife: 8, food: 9, walkability: 8, digitalNomad: 8 },
  'las-vegas':     { family: 6, romance: 7, luxury: 10, budget: 5, nightlife: 10, food: 9, walkability: 6, digitalNomad: 5 },
  honolulu:        { family: 9, romance: 10, luxury: 9, budget: 4, nightlife: 6, food: 8, walkability: 6, digitalNomad: 7 },
  maui:            { family: 9, romance: 10, luxury: 10, budget: 3, nightlife: 5, food: 7, walkability: 4, digitalNomad: 6 },
  toronto:         { family: 8, romance: 7, luxury: 8, budget: 4, nightlife: 8, food: 9, walkability: 8, digitalNomad: 8 },
  vancouver:       { family: 9, romance: 8, luxury: 8, budget: 4, nightlife: 7, food: 9, walkability: 8, digitalNomad: 8 },
  montreal:        { family: 8, romance: 9, luxury: 7, budget: 5, nightlife: 9, food: 9, walkability: 8, digitalNomad: 8 },
  'mexico-city':   { family: 7, romance: 7, luxury: 8, budget: 8, nightlife: 9, food: 10, walkability: 7, digitalNomad: 10 },
  tulum:           { family: 7, romance: 10, luxury: 9, budget: 5, nightlife: 8, food: 8, walkability: 4, digitalNomad: 9 },
  cancun:          { family: 9, romance: 8, luxury: 8, budget: 6, nightlife: 9, food: 7, walkability: 4, digitalNomad: 6 },
  oaxaca:          { family: 7, romance: 8, luxury: 6, budget: 9, nightlife: 6, food: 10, walkability: 8, digitalNomad: 8 },
  cartagena:       { family: 7, romance: 10, luxury: 9, budget: 8, nightlife: 8, food: 8, walkability: 8, digitalNomad: 7 },
  medellin:        { family: 7, romance: 7, luxury: 7, budget: 9, nightlife: 9, food: 8, walkability: 6, digitalNomad: 10 },
  'buenos-aires':  { family: 7, romance: 9, luxury: 8, budget: 7, nightlife: 10, food: 9, walkability: 8, digitalNomad: 9 },
  'rio-de-janeiro':{ family: 6, romance: 9, luxury: 9, budget: 6, nightlife: 10, food: 8, walkability: 6, digitalNomad: 8 },
  cusco:           { family: 6, romance: 9, luxury: 8, budget: 8, nightlife: 6, food: 8, walkability: 7, digitalNomad: 6 },
  lima:            { family: 7, romance: 6, luxury: 8, budget: 7, nightlife: 7, food: 10, walkability: 6, digitalNomad: 7 },
  quito:           { family: 6, romance: 7, luxury: 6, budget: 9, nightlife: 6, food: 7, walkability: 6, digitalNomad: 7 },
  santiago:        { family: 7, romance: 7, luxury: 8, budget: 6, nightlife: 8, food: 8, walkability: 7, digitalNomad: 8 },
  'panama-city':   { family: 7, romance: 7, luxury: 8, budget: 6, nightlife: 8, food: 8, walkability: 6, digitalNomad: 8 },
  havana:          { family: 6, romance: 10, luxury: 5, budget: 6, nightlife: 9, food: 6, walkability: 8, digitalNomad: 3 },

  // ── MENA ────────────────────────────────────────────────────────
  dubai:           { family: 10, romance: 9, luxury: 10, budget: 4, nightlife: 8, food: 9, walkability: 4, digitalNomad: 8 },
  'abu-dhabi':     { family: 9, romance: 8, luxury: 10, budget: 4, nightlife: 6, food: 8, walkability: 4, digitalNomad: 7 },
  doha:            { family: 8, romance: 8, luxury: 10, budget: 4, nightlife: 4, food: 8, walkability: 5, digitalNomad: 6 },
  amman:           { family: 6, romance: 7, luxury: 7, budget: 8, nightlife: 6, food: 8, walkability: 6, digitalNomad: 6 },
  petra:           { family: 7, romance: 9, luxury: 6, budget: 7, nightlife: 3, food: 5, walkability: 4, digitalNomad: 3 },
  cairo:           { family: 6, romance: 7, luxury: 7, budget: 8, nightlife: 7, food: 8, walkability: 5, digitalNomad: 6 },
  marrakech:       { family: 6, romance: 9, luxury: 9, budget: 8, nightlife: 6, food: 9, walkability: 6, digitalNomad: 7 },
  fes:             { family: 5, romance: 8, luxury: 7, budget: 8, nightlife: 4, food: 8, walkability: 6, digitalNomad: 5 },
  chefchaouen:     { family: 6, romance: 9, luxury: 5, budget: 9, nightlife: 3, food: 6, walkability: 7, digitalNomad: 5 },
  'tel-aviv':      { family: 7, romance: 8, luxury: 8, budget: 4, nightlife: 10, food: 9, walkability: 8, digitalNomad: 9 },

  // ── Africa ──────────────────────────────────────────────────────
  'cape-town':     { family: 8, romance: 9, luxury: 9, budget: 7, nightlife: 8, food: 9, walkability: 6, digitalNomad: 9 },
  johannesburg:    { family: 5, romance: 5, luxury: 8, budget: 8, nightlife: 7, food: 7, walkability: 3, digitalNomad: 7 },
  nairobi:         { family: 5, romance: 6, luxury: 8, budget: 7, nightlife: 7, food: 7, walkability: 3, digitalNomad: 7 },
  zanzibar:        { family: 7, romance: 10, luxury: 8, budget: 7, nightlife: 5, food: 7, walkability: 6, digitalNomad: 5 },
  'victoria-falls':{ family: 8, romance: 9, luxury: 8, budget: 6, nightlife: 4, food: 6, walkability: 5, digitalNomad: 4 },
  mauritius:       { family: 9, romance: 10, luxury: 10, budget: 4, nightlife: 5, food: 7, walkability: 4, digitalNomad: 6 },

  // ── Oceania ─────────────────────────────────────────────────────
  sydney:          { family: 9, romance: 8, luxury: 9, budget: 3, nightlife: 8, food: 9, walkability: 8, digitalNomad: 7 },
  melbourne:       { family: 8, romance: 7, luxury: 8, budget: 3, nightlife: 9, food: 10, walkability: 9, digitalNomad: 8 },
  brisbane:        { family: 9, romance: 7, luxury: 7, budget: 4, nightlife: 7, food: 8, walkability: 7, digitalNomad: 7 },
  auckland:        { family: 8, romance: 7, luxury: 7, budget: 3, nightlife: 7, food: 8, walkability: 7, digitalNomad: 7 },
  queenstown:      { family: 8, romance: 10, luxury: 9, budget: 3, nightlife: 7, food: 8, walkability: 7, digitalNomad: 6 },
  wellington:      { family: 7, romance: 7, luxury: 6, budget: 4, nightlife: 7, food: 8, walkability: 8, digitalNomad: 7 },

  // ── Phase 9 (10 new) ────────────────────────────────────────────
  nara:            { family: 8, romance: 8, luxury: 7, budget: 7, nightlife: 3, food: 7, walkability: 9, digitalNomad: 4 },
  hakone:          { family: 8, romance: 10, luxury: 9, budget: 5, nightlife: 3, food: 8, walkability: 5, digitalNomad: 4 },
  kandy:           { family: 7, romance: 8, luxury: 6, budget: 9, nightlife: 5, food: 8, walkability: 7, digitalNomad: 6 },
  'bora-bora':     { family: 6, romance: 10, luxury: 10, budget: 1, nightlife: 4, food: 7, walkability: 3, digitalNomad: 3 },
  nadi:            { family: 8, romance: 9, luxury: 8, budget: 6, nightlife: 6, food: 6, walkability: 4, digitalNomad: 5 },
  'san-juan':      { family: 8, romance: 9, luxury: 8, budget: 5, nightlife: 9, food: 8, walkability: 7, digitalNomad: 7 },
  'playa-del-carmen': { family: 8, romance: 9, luxury: 8, budget: 6, nightlife: 10, food: 8, walkability: 8, digitalNomad: 9 },
  'cabo-san-lucas':{ family: 7, romance: 9, luxury: 10, budget: 4, nightlife: 8, food: 7, walkability: 5, digitalNomad: 6 },
  ushuaia:         { family: 7, romance: 9, luxury: 7, budget: 5, nightlife: 5, food: 7, walkability: 6, digitalNomad: 4 },
  'sharm-el-sheikh':{ family: 8, romance: 8, luxury: 8, budget: 8, nightlife: 6, food: 6, walkability: 4, digitalNomad: 5 },
};

/** Get scores for a city, or null if not yet scored. */
export function findScores(citySlug: string): DestinationScores | null {
  return DESTINATION_SCORES[citySlug] ?? null;
}

/** Does this city have a scorecard? */
export function hasScores(citySlug: string): boolean {
  return Object.prototype.hasOwnProperty.call(DESTINATION_SCORES, citySlug);
}

/** All cities with scores — used by the AI quiz to rank matches. */
export function citiesWithScores(): ReadonlyArray<{ slug: string; scores: DestinationScores }> {
  return Object.entries(DESTINATION_SCORES).map(([slug, scores]) => ({
    slug,
    scores,
  }));
}

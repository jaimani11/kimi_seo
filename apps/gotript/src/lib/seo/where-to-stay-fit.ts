/**
 * Where-to-stay decision engine (pure, deterministic — unit-tested).
 *
 * The flagship planner's job is to help travelers DECIDE, not just search. This
 * scores a city's existing editor-written neighborhoods against a traveler
 * profile (first-timer / couple / family / budget / nightlife / quiet) using
 * keyword signals already present in each neighborhood's name + blurb — so it
 * works across every city with zero new per-city content (no content matrix).
 *
 * It is intentionally heuristic and transparent: the UI shows WHICH signals
 * matched, so a recommendation is explainable rather than a black box.
 */

export type ProfileId =
  | 'first-time'
  | 'couples'
  | 'families'
  | 'budget'
  | 'nightlife'
  | 'quiet';

export interface TravelerProfile {
  id: ProfileId;
  /** Chip label. */
  label: string;
  /** One-line "who this is" used in the prompt + recommendation copy. */
  intent: string;
  /**
   * Lowercase signal terms. A neighborhood scores +1 per DISTINCT term found in
   * its `${name} ${blurb}` (substring match). Ordered roughly strongest-first
   * for nicer "why" copy, but order does not affect the score.
   */
  signals: readonly string[];
}

export const TRAVELER_PROFILES: readonly TravelerProfile[] = [
  {
    id: 'first-time',
    label: 'First time here',
    intent: 'central, walkable, close to the famous sights',
    signals: [
      'central', 'centre', 'center', 'heart', 'main', 'iconic', 'famous',
      'landmark', 'historic', 'old town', 'old city', 'temple', 'square',
      'sights', 'must', 'downtown', 'scramble', 'walkable',
    ],
  },
  {
    id: 'couples',
    label: 'Couple / romantic',
    intent: 'charming, scenic, good for a romantic base',
    signals: [
      'romantic', 'charming', 'sunset', 'view', 'riverside', 'canal', 'wine',
      'cocktail', 'boutique', 'elegant', 'rooftop', 'stroll', 'café', 'cafe',
      'quiet', 'picturesque', 'cobbled',
    ],
  },
  {
    id: 'families',
    label: 'Family with kids',
    intent: 'space, parks, quiet and safe streets',
    signals: [
      'family', 'families', 'kid', 'kids', 'park', 'parks', 'museum', 'zoo',
      'aquarium', 'garden', 'gardens', 'beach', 'spacious', 'residential',
      'safe', 'quiet', 'green', 'playground',
    ],
  },
  {
    id: 'budget',
    label: 'On a budget',
    intent: 'affordable, local, good value',
    signals: [
      'budget', 'cheap', 'affordable', 'value', 'guesthouse', 'hostel',
      'backpacker', 'vintage', 'indie', 'market', 'street food', 'street-food',
      'local', 'bohemian', 'student',
    ],
  },
  {
    id: 'nightlife',
    label: 'Nightlife & bars',
    intent: 'bars, live music, late-night energy',
    signals: [
      'bar', 'bars', 'nightlife', 'club', 'clubs', 'izakaya', 'late-night',
      'late night', 'party', 'live music', 'golden gai', 'pub', 'pubs',
      'drinks', 'nightclub', 'buzzing', 'lively', 'energy',
    ],
  },
  {
    id: 'quiet',
    label: 'Quiet & local',
    intent: 'residential, calm, away from the crowds',
    signals: [
      'quiet', 'residential', 'local', 'low-rise', 'leafy', 'calm', 'peaceful',
      'laid-back', 'laid back', 'village', 'authentic', 'relaxed', 'sleepy',
      'green', 'tranquil', 'traditional',
    ],
  },
];

const PROFILE_BY_ID: ReadonlyMap<ProfileId, TravelerProfile> = new Map(
  TRAVELER_PROFILES.map((p) => [p.id, p]),
);

export function getProfile(id: ProfileId): TravelerProfile {
  const p = PROFILE_BY_ID.get(id);
  if (!p) throw new Error(`Unknown traveler profile: ${id}`);
  return p;
}

export interface NeighborhoodInput {
  name: string;
  blurb: string;
}

export interface ScoredNeighborhood {
  name: string;
  blurb: string;
  /** Original editor rank (0 = editors' top pick). */
  editorRank: number;
  /** Count of distinct matched signals (before the first-time rank bonus). */
  score: number;
  /** The distinct signal terms that matched, in profile order — the "why". */
  matched: string[];
}

/** True when a signal term appears as a substring of the haystack. */
function hasSignal(haystack: string, term: string): boolean {
  return haystack.includes(term);
}

/**
 * Score + rank a city's neighborhoods for one traveler profile.
 *
 * Deterministic and stable: primary sort by score (desc), ties broken by the
 * editors' original order (asc) so the result never depends on array identity
 * or locale. For `first-time`, the editors' top pick gets a +1 nudge — a
 * first-timer defaults to the marquee area unless another clearly out-signals it.
 */
export function scoreNeighborhoodsForProfile(
  neighborhoods: readonly NeighborhoodInput[],
  profileId: ProfileId,
): ScoredNeighborhood[] {
  const profile = getProfile(profileId);

  const scored: ScoredNeighborhood[] = neighborhoods.map((n, editorRank) => {
    const haystack = `${n.name} ${n.blurb}`.toLowerCase();
    const matched = profile.signals.filter((term) => hasSignal(haystack, term));
    let score = matched.length;
    if (profileId === 'first-time' && editorRank === 0) score += 1;
    return { name: n.name, blurb: n.blurb, editorRank, score, matched };
  });

  return scored.sort((a, b) => b.score - a.score || a.editorRank - b.editorRank);
}

export interface Recommendation {
  profile: TravelerProfile;
  ranked: ScoredNeighborhood[];
  top: ScoredNeighborhood | null;
  /**
   * False when NO neighborhood matched any signal (every score 0). The UI then
   * frames the top result as the editors' overall pick, not a profile match,
   * and shows no fabricated "why".
   */
  confident: boolean;
}

/** Full recommendation for a profile: ranked list + the confident top pick. */
export function recommendForProfile(
  neighborhoods: readonly NeighborhoodInput[],
  profileId: ProfileId,
): Recommendation {
  const profile = getProfile(profileId);
  const ranked = scoreNeighborhoodsForProfile(neighborhoods, profileId);
  const top = ranked[0] ?? null;
  // "first-time" always has a nonzero top (the +1 nudge), so gate confidence on
  // a real signal match, not the nudged score.
  const confident = !!top && top.matched.length > 0;
  return { profile, ranked, top, confident };
}

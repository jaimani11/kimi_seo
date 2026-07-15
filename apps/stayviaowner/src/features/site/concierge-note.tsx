import Link from 'next/link';
import { ArrowRight, Sparkle } from '@/features/shared/icons';

/**
 * Compact agentic "concierge note" panel that appears at the top of
 * /search results. Template-driven (no per-request LLM cost) but
 * tuned to feel like a friend-in-the-know rather than a search engine
 * caption. Surfaces a /plan CTA to convert browse intent into a multi-
 * day itinerary visit (multi-affiliate click).
 *
 * The note is built deterministically from the query — the noun
 * detected ("Tokyo", "cooking class", "Cappadocia balloon") drives
 * what the note says. Falls back to a generic-but-warm copy when
 * nothing recognizable surfaces.
 */
export function ConciergeNote({ query }: { query: string }) {
  const note = buildConciergeNote(query);
  if (!note) return null;
  return (
    <aside
      className="mb-8 flex flex-col gap-3 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, var(--surface-elevated) 0%, var(--surface-base) 100%)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid place-items-center rounded-full"
          style={{
            width: '2.1rem',
            height: '2.1rem',
            background: 'var(--accent-primary)',
            color: '#1a1a1a',
            flexShrink: 0,
          }}
        >
          <Sparkle size={13} />
        </span>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.62rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              margin: 0,
            }}
          >
            Concierge note
          </p>
          <p
            className="mt-1 max-w-xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '0.95rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {note.body}
          </p>
        </div>
      </div>
      <Link
        href={`/plan?d=${encodeURIComponent(note.planQuery)}&n=${note.suggestedNights}`}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition-opacity hover:opacity-90"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: 'var(--accent-primary)',
          color: '#1a1a1a',
          flexShrink: 0,
        }}
      >
        Plan a {note.planVerb}
        <ArrowRight size={13} strokeWidth={2.4} />
      </Link>
    </aside>
  );
}

interface BuiltNote {
  body: string;
  planQuery: string;
  suggestedNights: number;
  planVerb: string;
}

export function buildConciergeNote(rawQuery: string): BuiltNote | null {
  const query = rawQuery.trim();
  if (!query) return null;
  const lower = query.toLowerCase();

  // City heuristics — when we detect a known city by name we know what
  // to say. The list intentionally covers the high-intent queries
  // already in the sitemap.
  for (const city of CITY_HINTS) {
    if (lower.includes(city.match)) {
      return {
        body: city.body,
        planQuery: city.planDestination,
        suggestedNights: city.suggestedNights,
        planVerb: city.planVerb,
      };
    }
  }

  // Activity heuristics — query mentions a category (food, balloon,
  // snorkel, etc.). We use a generic "trip" plan target since no city
  // was named.
  for (const activity of ACTIVITY_HINTS) {
    if (activity.matches.some((m) => lower.includes(m))) {
      return {
        body: activity.body,
        planQuery: query,
        suggestedNights: 3,
        planVerb: 'day around it',
      };
    }
  }

  return {
    body: 'Live Vrbo inventory below — every card is bookable today. Tighten the search with a city name or a vibe, or let the planner build a day-by-day around it.',
    planQuery: query,
    suggestedNights: 3,
    planVerb: 'day around it',
  };
}

interface CityHint {
  match: string;
  body: string;
  planDestination: string;
  suggestedNights: number;
  planVerb: string;
}

const CITY_HINTS: readonly CityHint[] = [
  {
    match: 'tokyo',
    body: 'Tokyo experiences split into two daily peaks: 5–7am market tours and 6–8pm food walks. Stack one of each and Day 1 is full without exhausting you.',
    planDestination: 'Tokyo, Japan',
    suggestedNights: 4,
    planVerb: '4-day Tokyo',
  },
  {
    match: 'rome',
    body: 'Skip-the-line tickets at the Vatican and Colosseum are non-negotiable in season; food tours run best evening, walking tours best morning. Book the two anchors first, then plan around them.',
    planDestination: 'Rome, Italy',
    suggestedNights: 4,
    planVerb: '4-day Rome',
  },
  {
    match: 'paris',
    body: 'Paris loves a morning museum and an evening table. Skip-the-line Louvre or Orsay early, then leave afternoons unbooked for cafés and a quiet walk; reserve dinner experiences for the back half of the trip.',
    planDestination: 'Paris, France',
    suggestedNights: 4,
    planVerb: '4-day Paris',
  },
  {
    match: 'bali',
    body: 'Bali rewards two-base trips: south (Canggu / Uluwatu) for water and sunsets, central (Ubud) for jungle and temples. Pair a Mount Batur sunrise with a slower day after.',
    planDestination: 'Bali, Indonesia',
    suggestedNights: 5,
    planVerb: '5-day Bali',
  },
  {
    match: 'reykjav',
    body: 'Iceland day trips compound — one glacier hike, one Golden Circle, one Northern Lights chase, two free days for the in-between. Don\'t over-book the first day; you\'ll lose to jet lag.',
    planDestination: 'Reykjavík, Iceland',
    suggestedNights: 4,
    planVerb: '4-day Iceland',
  },
  {
    match: 'cappadocia',
    body: 'Balloon flights only run dawn and are weather-dependent — book Day 1 with a buffer Day 2 in case of cancellation. The pottery towns and underground cities fill the rest.',
    planDestination: 'Cappadocia, Türkiye',
    suggestedNights: 3,
    planVerb: '3-day Cappadocia',
  },
  {
    match: 'marrakech',
    body: 'Marrakech splits day and evening: souks and palaces under bright sun, food tours and rooftops after dusk. A desert day-trip from here is the highest-rated single experience.',
    planDestination: 'Marrakech, Morocco',
    suggestedNights: 4,
    planVerb: '4-day Marrakech',
  },
  {
    match: 'new york',
    body: 'New York concentrates around food, comedy, and rooftops. Stack the photo-bait early (sunrise One World, Top of the Rock), eat your way through Brooklyn after dark.',
    planDestination: 'New York, USA',
    suggestedNights: 4,
    planVerb: '4-day NYC',
  },
  {
    match: 'lisbon',
    body: 'Lisbon is walking + funiculars by day, fado tables after 9pm. A Sintra day-trip belongs mid-trip when you\'re ready to leave the city for half a day.',
    planDestination: 'Lisbon, Portugal',
    suggestedNights: 4,
    planVerb: '4-day Lisbon',
  },
  {
    match: 'santorini',
    body: 'The hero on Santorini is sunset — book a catamaran cruise for the back half of the trip, leave mornings for caldera walks. Two nights is the floor here; three is the sweet spot.',
    planDestination: 'Santorini, Greece',
    suggestedNights: 3,
    planVerb: '3-day Santorini',
  },
];

interface ActivityHint {
  matches: readonly string[];
  body: string;
}

const ACTIVITY_HINTS: readonly ActivityHint[] = [
  {
    matches: ['food tour', 'cooking class', 'tasting', 'wine'],
    body: 'Food experiences cluster at 6pm starts and run 3–4 hours. Eat light at lunch and skip dessert — the tour will deliver both.',
  },
  {
    matches: ['balloon', 'hot air'],
    body: 'Balloon flights run at sunrise only and depend on weather. Book the earliest morning of your trip with a backup day, and dress in layers.',
  },
  {
    matches: ['snorkel', 'scuba', 'sail', 'boat', 'cruise'],
    body: 'Water tours have the highest cancellation rates on rough days — book free-cancellation options and have a second-choice in your tab.',
  },
  {
    matches: ['ski', 'snowboard', 'slope'],
    body: 'Ski lessons fill fastest at peak season. Book the morning slot (better snow, smaller groups) and combine with a lift pass through the same supplier.',
  },
  {
    matches: ['glacier', 'volcano', 'hike', 'trek'],
    body: 'Volcanic and glacier hikes need real boots — most suppliers loan crampons. Check the included gear list before you book.',
  },
  {
    matches: ['private tour', 'private guide'],
    body: 'Private tours run 1.5–2× the per-person cost of a group — for families of 3+ they\'re often the same money and a much better pace.',
  },
];

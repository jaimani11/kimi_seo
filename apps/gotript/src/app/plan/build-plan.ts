import type { Plan, PlanDay, PlanQuery, PlanSlot } from '@lib/plan/types';
import type { Experience } from '@core/experience';
import { planDayThemes, themeLabel, themeQueryHint, themeRationale } from '@lib/plan/themes';
import { viatorClientFromEnv } from '@/providers/viator/client';
import { mapViatorProductToExperience } from '@/providers/viator/mapper';
import { encodeAffiliateLink } from '@lib/affiliate/link-encoder';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';

/**
 * Build an itinerary from a (destination, nights, vibe) tuple by:
 *   1. Picking a theme per day with `planDayThemes()`.
 *   2. Calling Viator freetext search per theme to find bookable
 *      experiences matching the theme + destination.
 *   3. Distributing the top picks across time bands (morning / midday /
 *      afternoon / evening) deterministically by rank.
 *   4. Stamping each pick with a /r/[id] affiliate redirect so every
 *      "Reserve" CTA is attribution-tracked.
 *
 * Server-only — uses Viator client + AbortController. Wrap callers in
 * a try/catch; this throws when Viator credentials are missing so the
 * caller can render an honest error page rather than empty slots.
 */
export async function buildPlan(query: PlanQuery): Promise<Plan> {
  const destination = query.destination.trim();
  const nights = clampNights(query.nights);
  const vibeTags = query.vibeTags;

  const client = viatorClientFromEnv();
  if (!client) {
    throw new Error('VIATOR_API_KEY + VIATOR_PARTNER_ID required to build a plan');
  }

  const themes = planDayThemes(nights, vibeTags);

  // Parallelize all per-theme searches — this is the only network-
  // bound step and they're fully independent.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('plan timeout')), 15_000);
  const experiencesByTheme = await Promise.all(
    themes.map(async (theme, dayIdx) => {
      try {
        const hint = themeQueryHint(theme, destination);
        const res = await client.freetextSearch(
          {
            searchTerm: hint,
            currency: 'USD',
            searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: 1, count: 12 } }],
            productSorting: { sort: theme === 'sunset-and-water' ? 'RATING' : 'DEFAULT' },
          },
          controller.signal,
        );
        const products = res.products?.results ?? [];
        // Stable but day-shifted slice so different days don't all pick
        // the same first 3 products.
        return products
          .slice(dayIdx % Math.max(1, Math.floor(products.length / 4)))
          .map((p) => mapViatorProductToExperience(p, { currency: 'USD' }));
      } catch {
        return [] as Experience[];
      }
    }),
  );
  clearTimeout(timer);

  // Avoid surfacing the same productCode on multiple days; each is
  // best-positioned where it ranks highest.
  const seen = new Set<string>();
  const days: PlanDay[] = themes.map((theme, i) => {
    const experiences = experiencesByTheme[i] ?? [];
    const fresh = experiences.filter((e) => {
      if (seen.has(e.productCode)) return false;
      seen.add(e.productCode);
      return true;
    });
    const slots = layoutSlots(theme, fresh.slice(0, 4));
    const position: 'first' | 'middle' | 'last' =
      i === 0 ? 'first' : i === themes.length - 1 ? 'last' : 'middle';
    const rationale = themeRationale(theme, position, themes[i - 1]);
    const day: PlanDay = {
      dayNumber: i + 1,
      theme,
      themeLabel: themeLabel(theme, destination),
      slots,
    };
    if (rationale) day.rationale = rationale;
    return day;
  });

  const summary = buildSummary(destination, nights, vibeTags);

  return {
    destination,
    nights,
    vibe: vibeTags,
    summary,
    days,
    query: { destination, nights, vibeTags },
  };
}

function clampNights(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 3;
  return Math.max(1, Math.min(7, Math.floor(n)));
}

function buildSummary(destination: string, nights: number, vibeTags: readonly string[]): string {
  const vibeText =
    vibeTags.length === 0
      ? 'a slow rhythm, eating on the way'
      : `${vibeTags.slice(0, 3).join(', ')}`;
  return `${nights} ${nights === 1 ? 'night' : 'nights'} in ${destination} — ${vibeText}. Each day pulls live Viator experiences ranked for the theme.`;
}

/**
 * Distribute up to four experiences across the four time bands of a
 * single day. Picks 1 is the headliner (morning or evening depending
 * on theme), the rest spread to fill gaps.
 */
function layoutSlots(theme: string, picks: Experience[]): PlanSlot[] {
  if (picks.length === 0) {
    return [
      {
        id: `slot-empty-${theme}`,
        timeBand: 'midday',
        brief: 'A quiet day to wander on your own terms.',
        picks: [],
      },
    ];
  }

  const slots: PlanSlot[] = [];
  const slotBriefs: Record<string, string> = {
    arrival: 'Settle in. A walking tour to map your neighborhood and a long table for dinner.',
    'food-and-wine': 'Eat the city — markets, the table, the family kitchen.',
    'culture-and-history': 'Skip the line, hear the stories, let a guide do the heavy lifting.',
    adventure: 'Push your legs, your stomach, your nerve. Reset by evening.',
    'sunset-and-water': 'Slow afternoon, water at golden hour, small dinner.',
    'day-trip': 'Out and back. A different town for a day; home for dinner.',
    'free-day': 'No plans. Lean on hidden-gem options if you want.',
    farewell: 'Walk, taste, photograph. Nothing that requires a reservation.',
  };
  const brief = slotBriefs[theme] ?? 'A focused, well-paced day.';

  const bands: PlanSlot['timeBand'][] = ['morning', 'midday', 'afternoon', 'evening'];

  for (let i = 0; i < Math.min(picks.length, bands.length); i++) {
    const pick = picks[i];
    if (!pick) continue;
    const reserveHref = buildReserveHref(pick);
    slots.push({
      id: `${pick.productCode}`,
      timeBand: bands[i] ?? 'midday',
      brief: i === 0 ? brief : 'Complement to the day.',
      picks: reserveHref ? [{ experience: pick, reserveHref }] : [],
    });
  }
  return slots;
}

function buildReserveHref(exp: Experience): string | null {
  const url = exp.affiliate.url;
  if (!url || !isAllowedAffiliateHost(url)) return null;
  const id = encodeAffiliateLink({
    url,
    providerId: exp.affiliate.providerId,
    stayId: exp.affiliate.stayId,
  });
  return `/r/${id}`;
}

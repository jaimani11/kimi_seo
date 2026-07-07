import type { SeoCity } from '@adored/seo-data';
import { findDestinationGuide, type DestinationGuide } from '@adored/seo-data';
import type {
  CitySocialPack,
  PinterestPin,
  ShortFormVideoScript,
  VideoScene,
} from './social-types';

/**
 * Deterministic template-based social pack generator. Runs without
 * any LLM key — pulls from existing DESTINATION_GUIDES content and
 * weaves it into platform-appropriate shapes.
 *
 * Quality vs. an LLM run: lower variety + more formulaic, but real
 * facts (food, neighborhoods, budgets) end up in every script. Good
 * enough to ship + post; the LLM mode swaps in for richer voice.
 */

const MUSIC_CUES = [
  'uplifting lo-fi travel beat',
  'cinematic ambient with light percussion',
  'dreamy indie-pop, mid-tempo',
  'mellow jazz, café ambience',
  'energetic electronic, festival vibe',
  'soft acoustic guitar, sunset mood',
];

export interface TemplateBrand {
  /** Display name used in hero copy + visual concepts ("numiworks"). */
  name: string;
  /** Compact domain label used in CTAs ("numiworks.com"). */
  label: string;
  /** Hashtag base without the # (usually the brand name). */
  hashtag: string;
}

export function createSocialTemplateGenerator(
  brand: TemplateBrand,
): (city: SeoCity) => CitySocialPack {
  const CTA_OPTIONS = [
    `Plan your trip on ${brand.label}`,
    `Build the itinerary at ${brand.label}`,
    `Free AI trip planner → ${brand.label}`,
    `Get the full guide on ${brand.label}`,
    `Bookable on Viator via ${brand.label}`,
  ];

function buildSocialPackFromTemplate(city: SeoCity): CitySocialPack {
  const guide = findDestinationGuide(city.slug);

  return {
    citySlug: city.slug,
    cityName: city.name,
    pinterest: buildPinterestPins(city, guide),
    tiktok: buildVideoScripts(city, guide, 'tiktok'),
    reels: buildVideoScripts(city, guide, 'instagram-reels'),
    shorts: buildVideoScripts(city, guide, 'youtube-shorts'),
    generatedAt: '2026-06-12T00:00:00.000Z',
    source: 'template-fallback',
  };
}

function pickCta(seed: number): string {
  return CTA_OPTIONS[seed % CTA_OPTIONS.length] ?? CTA_OPTIONS[0]!;
}

function pickMusic(seed: number): string {
  return MUSIC_CUES[seed % MUSIC_CUES.length] ?? MUSIC_CUES[0]!;
}

function asciiOnly(s: string): string {
  // Hashtags must be ASCII letters/digits/underscores per the schema
  // regex. Strip accents and any non-matching character.
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function hashtagsFor(city: SeoCity, extra: readonly string[] = []): string[] {
  const slug = asciiOnly(city.slug);
  const country = asciiOnly(city.countryName);
  const base = [
    `#${slug}`,
    `#${slug}travel`,
    `#${country}`,
    '#traveltok',
    '#travelreels',
    `#${brand.hashtag}`,
  ];
  return [...base, ...extra].slice(0, 10);
}

// ============== Pinterest ==============

function buildPinterestPins(
  city: SeoCity,
  guide: DestinationGuide | null,
): PinterestPin[] {
  const pins: PinterestPin[] = [];

  // 1. Hero "X-day itinerary"
  for (const days of [3, 5, 7]) {
    pins.push({
      platform: 'pinterest',
      title: `The Perfect ${days}-Day ${city.name} Itinerary`,
      description: `A day-by-day ${days}-day plan for ${city.name}, ${city.countryName} — bookable experiences, smart sequencing, and where to stay. ${city.oneLiner}`,
      visualConcept: `Aerial or iconic skyline shot of ${city.name} at golden hour with overlay text "${days}-DAY ${city.name.toUpperCase()} GUIDE".`,
      hashtags: hashtagsFor(city, ['#itinerary', `#${days}dayitinerary`]),
      cta: pickCta(days),
    });
  }

  // 2. Things to do
  pins.push({
    platform: 'pinterest',
    title: `What to do in ${city.name} (curated)`,
    description: `A curated list of the best tours, day trips and experiences in ${city.name}. ${city.oneLiner}`,
    visualConcept: `Grid of 4 cinematic ${city.name} scenes: a famous landmark, a food close-up, a street scene, and a nightlife shot.`,
    hashtags: hashtagsFor(city, ['#thingstodo', '#bucketlist']),
    cta: pickCta(7),
  });

  // 3. Best time to visit
  if (guide) {
    pins.push({
      platform: 'pinterest',
      title: `When to visit ${city.name}: ${guide.bestTimeToVisit.months}`,
      description: `${guide.bestTimeToVisit.blurb} Plan your perfect ${city.name} trip.`,
      visualConcept: `${city.name} during peak season: representative seasonal landmark shot, with text overlay "BEST TIME: ${guide.bestTimeToVisit.months}".`,
      hashtags: hashtagsFor(city, ['#besttimetovisit', '#travelplanning']),
      cta: pickCta(2),
    });

    // 4. Budget guide
    pins.push({
      platform: 'pinterest',
      title: `${city.name} on a budget: $${guide.budget.budgetDailyUSD}–$${guide.budget.luxuryDailyUSD}/day`,
      description: `Budget: $${guide.budget.budgetDailyUSD}/day · Mid: $${guide.budget.midDailyUSD}/day · Luxury: $${guide.budget.luxuryDailyUSD}/day. ${guide.budget.blurb}`,
      visualConcept: `Stylized typographic pin with three columns: BUDGET / MID / LUXURY, each with a price and a representative image.`,
      hashtags: hashtagsFor(city, ['#budgettravel', '#travelbudget']),
      cta: pickCta(4),
    });

    // 5. Food guide. The pin title has a hard 100-char schema cap;
    // drop dishes from the end (rather than mid-word truncating) so
    // the title stays clean for cities with long dish names.
    const titlePrefix = `Eat your way through ${city.name}: `;
    const maxDishes = 100 - titlePrefix.length;
    let dishes = guide.food.slice(0, 4).map((f) => f.dish).join(', ');
    while (dishes.length > maxDishes && dishes.includes(', ')) {
      dishes = dishes.slice(0, dishes.lastIndexOf(', '));
    }
    pins.push({
      platform: 'pinterest',
      title: `${titlePrefix}${dishes}`,
      description: `${guide.food
        .slice(0, 3)
        .map((f) => `${f.dish}: ${f.note}`)
        .join(' ')}`.slice(0, 480),
      visualConcept: `Top-down hero shot of ${city.name}'s most photogenic dish, plated dark-and-moody.`,
      hashtags: hashtagsFor(city, ['#foodtravel', '#foodie']),
      cta: pickCta(1),
    });

    // 6. Neighborhood guide
    const hoods = guide.neighborhoods.slice(0, 3).map((n) => n.name).join(', ');
    pins.push({
      platform: 'pinterest',
      title: `Where to stay in ${city.name}: ${hoods}`,
      description: guide.neighborhoods
        .slice(0, 3)
        .map((n) => `${n.name} — ${n.blurb}`)
        .join(' ')
        .slice(0, 480),
      visualConcept: `Stylized map of ${city.name} with neighborhoods highlighted in ${brand.name} brand colors, plus a small landmark icon per neighborhood.`,
      hashtags: hashtagsFor(city, ['#wheretostay', '#neighborhoodguide']),
      cta: pickCta(0),
    });

    // 7. Safety
    pins.push({
      platform: 'pinterest',
      title: `Is ${city.name} safe? An honest answer`,
      description: `${guide.safety} Read the full guide before you go.`,
      visualConcept: `A peaceful daytime street scene in ${city.name} with calm pedestrians and good light.`,
      hashtags: hashtagsFor(city, ['#travelsafety']),
      cta: pickCta(5),
    });

    // 8. Family travel — routes to /{slug}-with-kids themed page.
    pins.push({
      platform: 'pinterest',
      title: `${city.name} with kids: the family guide`,
      description: `${guide.travelStyles.family}`,
      visualConcept: `A family-friendly ${city.name} scene — kids at a famous attraction, well-lit, candid.`,
      hashtags: hashtagsFor(city, ['#familytravel', '#travelwithkids']),
      cta: pickCta(3),
      pathSlug: `${city.slug}-with-kids`,
    });

    // 11. Teens travel — routes to /{slug}-with-teens.
    pins.push({
      platform: 'pinterest',
      title: `${city.name} with teens: what actually works`,
      description: `Activities in ${city.name} that don't feel corny to teenagers — bookable tours, cool neighborhoods, food that photographs well. ${city.oneLiner}`,
      visualConcept: `A candid teen-aged group in ${city.name} — casual walk, phones out, unposed.`,
      hashtags: hashtagsFor(city, ['#familytravel', '#teentravel']),
      cta: pickCta(8),
      pathSlug: `${city.slug}-with-teens`,
    });

    // 12. Airport guide — routes to /{slug}-airport-guide.
    pins.push({
      platform: 'pinterest',
      title: `${city.name} airport guide: transit, lounges, timing`,
      description: `How to get from ${city.name}'s airport to the city, which transit option is fastest, lounges worth using, and how long to leave for security. ${city.oneLiner}`,
      visualConcept: `Iconic ${city.name} airport terminal shot or arrivals hall with soft indoor light.`,
      hashtags: hashtagsFor(city, ['#airportguide', '#traveltips']),
      cta: pickCta(9),
      pathSlug: `${city.slug}-airport-guide`,
    });

    // 13. Budget per day — routes to /{slug}-budget-per-day.
    pins.push({
      platform: 'pinterest',
      title: `${city.name} daily budget: what a real day costs`,
      description: `Real spending in ${city.name}: breakfast, transit, activity, dinner, coffee stops. Numbers that stand up to the actual trip — not a stock estimate.`,
      visualConcept: `Overhead flat-lay: a passport, local currency, a coffee, and a small map of ${city.name}.`,
      hashtags: hashtagsFor(city, ['#budgettravel', '#travelmoney']),
      cta: pickCta(10),
      pathSlug: `${city.slug}-budget-per-day`,
    });

    // 14. Bachelor party — routes to /bachelor-party-in-{slug}.
    pins.push({
      platform: 'pinterest',
      title: `Bachelor party in ${city.name}: the plan`,
      description: `Where to stay, which bars actually deliver, day activities that beat the hangover, and dinner that seats 10+. ${city.oneLiner}`,
      visualConcept: `A rooftop or nightlife scene in ${city.name} at dusk — group silhouettes, city lights.`,
      hashtags: hashtagsFor(city, ['#bachelorparty', '#groupstravel']),
      cta: pickCta(11),
      pathSlug: `bachelor-party-in-${city.slug}`,
    });

    // 15. Bachelorette party — routes to /bachelorette-party-in-{slug}.
    pins.push({
      platform: 'pinterest',
      title: `Bachelorette party in ${city.name}: the plan`,
      description: `Photogenic brunches, a spa afternoon, a group activity that photographs well, and a night out worth remembering. ${city.oneLiner}`,
      visualConcept: `Bright daytime brunch or terrace shot in ${city.name}: pastel palette, floral touches, group of friends.`,
      hashtags: hashtagsFor(city, ['#bachelorette', '#girlstrip']),
      cta: pickCta(12),
      pathSlug: `bachelorette-party-in-${city.slug}`,
    });

    // 9. Couples
    pins.push({
      platform: 'pinterest',
      title: `${city.name} for couples`,
      description: `${guide.travelStyles.couples}`,
      visualConcept: `A romantic ${city.name} sunset scene — a candlelit terrace, water reflections, soft golden light.`,
      hashtags: hashtagsFor(city, ['#romanticgetaway', '#couplestravel']),
      cta: pickCta(2),
    });

    // 10. Solo
    pins.push({
      platform: 'pinterest',
      title: `Solo in ${city.name}: a complete guide`,
      description: `${guide.travelStyles.solo}`,
      visualConcept: `A solo traveler at a ${city.name} café or viewpoint, contemplative, alone but not lonely.`,
      hashtags: hashtagsFor(city, ['#solotravel', '#solofemaletravel']),
      cta: pickCta(6),
    });
  }

  // Backfill to ensure 10 pins even when there's no guide (very rare).
  while (pins.length < 10) {
    pins.push({
      platform: 'pinterest',
      title: `${city.name}, ${city.countryName} travel guide`,
      description: city.oneLiner,
      visualConcept: `An iconic ${city.name} skyline shot at sunset.`,
      hashtags: hashtagsFor(city),
      cta: pickCta(pins.length),
    });
  }

  return pins.slice(0, 10);
}

// ============== Short-form video scripts ==============

function buildVideoScripts(
  city: SeoCity,
  guide: DestinationGuide | null,
  platform: 'tiktok' | 'instagram-reels' | 'youtube-shorts',
): ShortFormVideoScript[] {
  const out: ShortFormVideoScript[] = [];

  // Reusable scene catalog drawn from guide content.
  const foodHighlights = (guide?.food ?? []).slice(0, 4);
  const neighborhoods = (guide?.neighborhoods ?? []).slice(0, 4);
  const safetyLine = guide?.safety ?? `${city.name} is generally safe — common sense applies.`;
  const bestTime =
    guide?.bestTimeToVisit ?? { months: 'spring or autumn', blurb: 'Mild weather, smaller crowds.' };
  const budgetTier =
    guide?.budget ?? { budgetDailyUSD: 0, midDailyUSD: 0, luxuryDailyUSD: 0, blurb: '' };

  const cta = `${pickCta(0)} — link in bio.`;

  // Script 1 — "Don't visit X without doing these 3 things"
  // Phase 7: not every SEO city has an authored guide, so this
  // script must pad to ≥3 scenes even when foodHighlights is empty.
  const mustDoScenes: VideoScene[] = foodHighlights.slice(0, 3).map((f) => ({
    visual: `Close-up shot of ${f.dish} being prepared or eaten in ${city.name}.`,
    text: `${f.dish}`,
    voiceover: `${f.note}`,
  }));
  while (mustDoScenes.length < 3) {
    mustDoScenes.push({
      visual: `An iconic ${city.name} scene — landmark, market, or viewpoint.`,
      text: `${city.name} essentials`,
      voiceover: `${city.oneLiner}`,
    });
  }
  out.push({
    platform,
    hook: `Don't visit ${city.name} without doing these 3 things 👇`,
    scenes: mustDoScenes.slice(0, 3),
    cta,
    durationSec: 22,
    musicCue: pickMusic(0),
    hashtags: hashtagsFor(city, ['#mustdo', '#travelhacks']),
  });

  // Script 2 — "Best time to visit"
  out.push({
    platform,
    hook: `Best time to visit ${city.name}?`,
    scenes: [
      {
        visual: `Wide aerial of ${city.name} during peak season.`,
        text: `${bestTime.months}`,
        voiceover: `${bestTime.blurb}`,
      },
      {
        visual: `A counterpoint shot — off-season ${city.name}, fewer crowds.`,
        text: 'Why those months?',
        voiceover: `Mild weather, fewer tourists, lower prices.`,
      },
      {
        visual: `Calendar overlay showing the recommended months highlighted.`,
        text: `Book now to save`,
        voiceover: `Plan ahead — these months book out fast.`,
      },
    ],
    cta,
    durationSec: 18,
    musicCue: pickMusic(1),
    hashtags: hashtagsFor(city, ['#besttimetovisit', '#travelplanning']),
  });

  // Script 3 — "How much does X cost per day"
  out.push({
    platform,
    hook: `How much does ${city.name} cost per day? 💸`,
    scenes: [
      {
        visual: `B-roll of street food / public transport in ${city.name}.`,
        text: `Budget: $${budgetTier.budgetDailyUSD}/day`,
        voiceover: `On a backpacker budget you can manage $${budgetTier.budgetDailyUSD} a day.`,
      },
      {
        visual: `Mid-range hotel + sit-down restaurant scene.`,
        text: `Mid-range: $${budgetTier.midDailyUSD}/day`,
        voiceover: `Mid-range trips run about $${budgetTier.midDailyUSD} a day.`,
      },
      {
        visual: `Luxury hotel pool / fine-dining shot.`,
        text: `Luxury: $${budgetTier.luxuryDailyUSD}/day`,
        voiceover: `Luxury travelers start around $${budgetTier.luxuryDailyUSD} a day.`,
      },
    ],
    cta,
    durationSec: 18,
    musicCue: pickMusic(2),
    hashtags: hashtagsFor(city, ['#budgettravel', '#traveltips']),
  });

  // Script 4 — "Where to stay" (always produces 3 scenes; pads with
  // generic content when guide has fewer neighborhoods).
  const stayScenes: VideoScene[] = neighborhoods.slice(0, 3).map((n) => ({
    visual: `Walking shot through ${n.name}, ${city.name}.`,
    text: `${n.name}`,
    voiceover: n.blurb,
  }));
  while (stayScenes.length < 3) {
    stayScenes.push({
      visual: `An overview shot of one of ${city.name}'s lively areas.`,
      text: 'And the rest of the city',
      voiceover: `${city.name}'s wider neighborhoods reward an afternoon wander.`,
    });
  }
  out.push({
    platform,
    hook: `Where to stay in ${city.name}`,
    scenes: stayScenes,
    cta,
    durationSec: 20,
    musicCue: pickMusic(3),
    hashtags: hashtagsFor(city, ['#wheretostay', '#hotelpicks']),
  });

  // Script 5 — "Foods you have to try" (always produces ≥3 scenes;
  // pads with a generic food note when guide has fewer dishes).
  const foodScenes: VideoScene[] = foodHighlights.slice(0, 5).map((f) => ({
    visual: `Close-up of ${f.dish} being prepared or eaten.`,
    text: f.dish,
    voiceover: f.note,
  }));
  while (foodScenes.length < 3) {
    foodScenes.push({
      visual: `A market or street-food scene in ${city.name}.`,
      text: 'Local market bites',
      voiceover: `Pick a street-food stall and order what the line is ordering.`,
    });
  }
  out.push({
    platform,
    hook: `${Math.max(3, foodHighlights.length)} foods you HAVE to try in ${city.name} 🍜`,
    scenes: foodScenes,
    cta,
    durationSec: 28,
    musicCue: pickMusic(4),
    hashtags: hashtagsFor(city, ['#foodtok', '#streetfood']),
  });

  // Script 6 — "Solo travel in X"
  out.push({
    platform,
    hook: `Is ${city.name} good for solo travel?`,
    scenes: [
      {
        visual: `Solo traveler at a famous ${city.name} viewpoint.`,
        text: 'YES.',
        voiceover: `Short answer: yes.`,
      },
      {
        visual: `A friendly café scene with a solo diner reading.`,
        text: `Vibe`,
        voiceover: guide?.travelStyles.solo ?? `Easy and welcoming for solo travelers.`,
      },
      {
        visual: `Map of ${city.name} with safe neighborhoods highlighted.`,
        text: `Safety`,
        voiceover: safetyLine,
      },
    ],
    cta,
    durationSec: 22,
    musicCue: pickMusic(5),
    hashtags: hashtagsFor(city, ['#solotravel', '#solofemaletraveler']),
  });

  // Script 7 — "Hidden gem"
  out.push({
    platform,
    hook: `Hidden gem in ${city.name} that tourists miss`,
    scenes: [
      {
        visual: `A lesser-known corner of ${city.name} that feels local.`,
        text: 'Locals know',
        voiceover: `Most tourists never see this side of ${city.name}.`,
      },
      {
        visual: `Continue walking the hidden street, café reveal.`,
        text: 'Why we love it',
        voiceover: `${city.oneLiner}`,
      },
      {
        visual: `Sunset shot of the same neighborhood.`,
        text: 'Save this for your trip',
        voiceover: `Save this for your ${city.name} trip.`,
      },
    ],
    cta,
    durationSec: 20,
    musicCue: pickMusic(0),
    hashtags: hashtagsFor(city, ['#hiddengem', '#localtips']),
  });

  // Script 8 — "Day in the life"
  out.push({
    platform,
    hook: `A day in ${city.name} 📍`,
    scenes: [
      {
        visual: `Morning coffee at a local café.`,
        text: 'Morning',
        voiceover: `Start with coffee at a neighborhood spot.`,
      },
      {
        visual: `Walking tour or museum scene mid-morning.`,
        text: 'Midday',
        voiceover: `${neighborhoods[0]?.blurb ?? 'Walk the historic core.'}`,
      },
      {
        visual: `Sunset shot of a famous viewpoint.`,
        text: 'Golden hour',
        voiceover: `Stay out for golden hour — every traveler's favorite hour here.`,
      },
      {
        visual: `Dinner table scene with the city's signature dish.`,
        text: 'Dinner',
        voiceover: `${foodHighlights[0]?.note ?? 'Sit down to the city signature.'}`,
      },
    ],
    cta,
    durationSec: 28,
    musicCue: pickMusic(2),
    hashtags: hashtagsFor(city, ['#travelvlog', '#dayinthelife']),
  });

  // Script 9 — "Pack like this"
  out.push({
    platform,
    hook: `Pack like this for ${city.name}`,
    scenes: [
      {
        visual: `Packing layout shot from above — neutral clothes, walking shoes.`,
        text: 'Walking shoes',
        voiceover: `Comfortable walking shoes — ${city.name} is walkable.`,
      },
      {
        visual: `A small day-bag and a translation app on a phone.`,
        text: 'Light day bag',
        voiceover: `A small crossbody bag is enough for most days.`,
      },
      {
        visual: `Weather-appropriate accessory shot for the season.`,
        text: `Weather: ${bestTime.months}`,
        voiceover: `Pack for the season: ${bestTime.months}.`,
      },
    ],
    cta,
    durationSec: 18,
    musicCue: pickMusic(3),
    hashtags: hashtagsFor(city, ['#packingtips', '#travelpacking']),
  });

  // Script 10 — "Why I keep coming back"
  out.push({
    platform,
    hook: `Why I keep coming back to ${city.name}`,
    scenes: [
      {
        visual: `Establishing shot — the most iconic ${city.name} skyline.`,
        text: 'It hits different',
        voiceover: `${city.oneLiner}`,
      },
      {
        visual: `A close personal-feeling shot — café table, hands, candid local.`,
        text: 'The people',
        voiceover: `It's not about the landmarks. It's about the rhythm.`,
      },
      {
        visual: `Sunset over the city, slow motion.`,
        text: 'Save this',
        voiceover: `Save this — your ${city.name} trip starts here.`,
      },
    ],
    cta,
    durationSec: 24,
    musicCue: pickMusic(5),
    hashtags: hashtagsFor(city, ['#wanderlust', '#travelinspo']),
  });

  return out.slice(0, 10);
}

  return buildSocialPackFromTemplate;
}

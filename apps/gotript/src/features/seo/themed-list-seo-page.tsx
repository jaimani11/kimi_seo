import Link from 'next/link';
import { ExperienceCardStandard } from '@/features/experience-cards';
import { SeoPageShell } from './seo-page-shell';
import type { SeoCity } from '@lib/seo/cities';
import type { ThemedListTheme } from '@lib/seo/route-parser';
import type { Experience } from '@core/experience';
import { GygActivitiesWidget } from '@/features/experiences/getyourguide-widget';

/**
 * SEO-shaped themed-list page. One page renderer powers three URL
 * shapes via the `theme` discriminator:
 *
 *   theme=family      → /best-family-activities-in-{city}
 *   theme=food        → /best-food-tours-in-{city}
 *   theme=day-trips   → /day-trips-from-{city}
 *
 * Each renders a city-themed Viator inventory grid with an editorial
 * H1, intro paragraph tuned for the theme, breadcrumbs, and the
 * SeoPageShell's auto-cross-link rail to every other valid SEO
 * surface for the same city.
 *
 * When live Viator inventory is missing, the page renders a soft
 * empty state — copy + cross-links remain useful.
 */
export function ThemedListSeoPage({
  city,
  theme,
  experiences,
  loadError,
}: {
  city: SeoCity;
  theme: ThemedListTheme;
  experiences: Experience[];
  loadError: string | null;
}) {
  const meta = THEME_META[theme];
  const slug = meta.slugFor
    ? meta.slugFor(city)
    : `${meta.slugPrefix}${city.slug}`;
  const heading = meta.heading(city);
  const intro = meta.intro(city);

  return (
    <SeoPageShell
      city={city}
      currentSlug={slug}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '/destinations' },
        { label: city.name, href: `/things-to-do-in-${city.slug}` },
        { label: meta.crumb },
      ]}
    >
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-6 md:pt-12">
        <header className="mx-auto max-w-3xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {meta.eyebrow(city)}
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {heading}
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: '1rem auto 0',
            }}
          >
            {intro}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/destinations/${city.slug}`}
              className="rounded-full border px-3.5 py-1.5 transition-colors hover:border-[color:var(--accent-primary)]"
              style={chipStyle()}
            >
              {city.name} travel guide →
            </Link>
            <Link
              href={`/${city.slug}-3-day-itinerary`}
              className="rounded-full border px-3.5 py-1.5 transition-colors hover:border-[color:var(--accent-primary)]"
              style={chipStyle()}
            >
              3-day plan →
            </Link>
            <Link
              href={`/weekend-in-${city.slug}`}
              className="rounded-full border px-3.5 py-1.5 transition-colors hover:border-[color:var(--accent-primary)]"
              style={chipStyle()}
            >
              Weekend in {city.name} →
            </Link>
          </div>
        </header>
      </section>

      {/* GetYourGuide widget — theme-tuned query so per-theme CTR
        * rolls up cleanly in the partner dashboard. */}
      <GygActivitiesWidget
        destination={gygDestinationFor(theme, city.name)}
        heading={gygHeadingFor(theme, city.name)}
        blurb={`Bookable through GetYourGuide. Skip-the-line, verified guides.`}
        campaignSlug={`themed-${theme}-${city.slug}`}
        numberOfItems={6}
      />

      <section className="mx-auto max-w-6xl px-6 pt-4 pb-16">
        {experiences.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((e) => (
              <ExperienceCardStandard key={e.id} experience={e} dense />
            ))}
          </div>
        ) : (
          <p
            className="mx-auto mt-8 max-w-2xl rounded-xl border px-5 py-4 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'var(--ink-secondary)',
              borderColor: 'var(--border-subtle)',
              background: 'var(--surface-elevated)',
            }}
          >
            {loadError
              ? `Live Viator inventory is temporarily unavailable. Try again in a moment.`
              : `Live Viator inventory hasn’t been configured for this environment yet. Cards will populate once VIATOR_API_KEY is set.`}
          </p>
        )}
      </section>
    </SeoPageShell>
  );
}

function chipStyle(): React.CSSProperties {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    borderColor: 'var(--border-subtle)',
    textDecoration: 'none',
  };
}

/**
 * Per-theme: the Viator search term, the H1 heading, the intro copy,
 * the breadcrumb label, the eyebrow above the H1.
 */
export const THEME_META: Record<
  ThemedListTheme,
  {
    /** Legacy: for prefix-shaped patterns like `honeymoon-in-{city}`.
     *  For anything more complex (suffix shape, city-in-middle), use
     *  `slugFor` instead. */
    slugPrefix: string;
    /** Preferred: build the slug for a specific city. Overrides
     *  `slugPrefix` when both are present. */
    slugFor?: (city: SeoCity) => string;
    crumb: string;
    eyebrow: (city: SeoCity) => string;
    heading: (city: SeoCity) => string;
    intro: (city: SeoCity) => string;
    viatorQuery: (city: SeoCity) => string;
  }
> = {
  family: {
    slugPrefix: 'best-family-activities-in-',
    crumb: 'Family activities',
    eyebrow: (c) => `${c.countryName} · family travel`,
    heading: (c) => `Best Family Activities in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} A curated grid of family-friendly Viator experiences in ${c.name} — kid-safe, age-appropriate, and bookable in one tap.`,
    viatorQuery: (c) => `${c.viatorQuery} family kids`,
  },
  food: {
    slugPrefix: 'best-food-tours-in-',
    crumb: 'Food tours',
    eyebrow: (c) => `${c.countryName} · food + drink`,
    heading: (c) => `Best Food Tours in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} The best food tours, tastings, market visits and cooking classes in ${c.name} — all live, all bookable on Viator.`,
    viatorQuery: (c) => `${c.viatorQuery} food tour cooking class`,
  },
  'day-trips': {
    slugPrefix: 'day-trips-from-',
    crumb: 'Day trips',
    eyebrow: (c) => `${c.countryName} · day trips`,
    heading: (c) => `Best Day Trips from ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} Curated day-trip ideas from ${c.name} — sights you can comfortably see and return for dinner. All bookable through Viator.`,
    viatorQuery: (c) => `day trip from ${c.name}`,
  },
  honeymoon: {
    slugPrefix: 'honeymoon-in-',
    crumb: 'Honeymoon',
    eyebrow: (c) => `${c.countryName} · honeymoon`,
    heading: (c) => `Honeymoon in ${c.name}: The Complete Guide`,
    intro: (c) =>
      `${c.oneLiner} Sunset cruises, private dinners, couples spa experiences and romantic viewpoints — the ${c.name} activities honeymooners actually book. Every experience is live and skip-the-line eligible.`,
    viatorQuery: (c) => `romantic couples ${c.viatorQuery}`,
  },
  'solo-travel': {
    slugPrefix: 'solo-travel-in-',
    crumb: 'Solo travel',
    eyebrow: (c) => `${c.countryName} · solo travel`,
    heading: (c) => `Solo Travel in ${c.name}: Small-Group Tours &amp; Safe Experiences`,
    intro: (c) =>
      `${c.oneLiner} Solo-friendly small-group tours, walking food tours, day trips and workshops in ${c.name} — meet other travelers, keep your independence, book everything in one place.`,
    viatorQuery: (c) => `small group tour ${c.viatorQuery}`,
  },
  'girls-trip': {
    slugPrefix: 'girls-trip-in-',
    crumb: 'Girls trip',
    eyebrow: (c) => `${c.countryName} · girls' trip`,
    heading: (c) => `Girls' Trip in ${c.name}: The Ultimate Bucket List`,
    intro: (c) =>
      `${c.oneLiner} Wine tastings, spa half-days, rooftop bars, boat trips and photo tours in ${c.name} — the activities your group chat will actually agree on. All bookable in one tap.`,
    viatorQuery: (c) => `wine tasting spa ${c.viatorQuery}`,
  },
  'rainy-day': {
    slugPrefix: 'rainy-day-in-',
    crumb: 'Rainy day',
    eyebrow: (c) => `${c.countryName} · indoor activities`,
    heading: (c) => `Rainy Day in ${c.name}: Indoor Activities &amp; Tours`,
    intro: (c) =>
      `${c.oneLiner} Museums, escape rooms, cooking classes, indoor markets, cocktail-making sessions and covered walking tours in ${c.name} — bookable rain-or-shine activities so a wet forecast doesn't waste your day.`,
    viatorQuery: (c) => `indoor museum cooking class ${c.viatorQuery}`,
  },
  night: {
    slugPrefix: 'night-in-',
    crumb: 'At night',
    eyebrow: (c) => `${c.countryName} · nightlife`,
    heading: (c) => `${c.name} at Night: Best Evening Tours &amp; Nightlife`,
    intro: (c) =>
      `${c.oneLiner} Sunset boat cruises, evening walking tours, ghost tours, night photography walks and rooftop bar experiences in ${c.name} — the city's best after-dark bookable activities.`,
    viatorQuery: (c) => `evening night tour ${c.viatorQuery}`,
  },
  spring: {
    slugPrefix: 'spring-in-',
    crumb: 'Spring',
    eyebrow: (c) => `${c.countryName} · spring (Mar-May)`,
    heading: (c) => `Spring in ${c.name}: Best Things to Do (March-May)`,
    intro: (c) =>
      `${c.oneLiner} Cherry blossoms, garden tours, spring festivals, outdoor markets and shoulder-season crowds in ${c.name} — the best bookable spring activities before summer prices hit.`,
    viatorQuery: (c) => `spring garden festival ${c.viatorQuery}`,
  },
  summer: {
    slugPrefix: 'summer-in-',
    crumb: 'Summer',
    eyebrow: (c) => `${c.countryName} · summer (Jun-Aug)`,
    heading: (c) => `Summer in ${c.name}: Best Tours &amp; Activities`,
    intro: (c) =>
      `${c.oneLiner} Boat trips, beach clubs, rooftop tours, outdoor food markets and long-daylight walking tours in ${c.name} — peak-season activities worth the crowds, all skip-the-line.`,
    viatorQuery: (c) => `summer boat rooftop ${c.viatorQuery}`,
  },
  fall: {
    slugPrefix: 'fall-in-',
    crumb: 'Fall',
    eyebrow: (c) => `${c.countryName} · fall (Sep-Nov)`,
    heading: (c) => `Fall in ${c.name}: Autumn Foliage Tours &amp; Activities`,
    intro: (c) =>
      `${c.oneLiner} Foliage day trips, harvest food tours, autumn walking guides and quieter shoulder-season experiences in ${c.name} — the sweet spot between summer crowds and winter chill.`,
    viatorQuery: (c) => `autumn foliage harvest ${c.viatorQuery}`,
  },
  winter: {
    slugPrefix: 'winter-in-',
    crumb: 'Winter',
    eyebrow: (c) => `${c.countryName} · winter (Dec-Feb)`,
    heading: (c) => `Winter in ${c.name}: Best Tours &amp; Cold-Weather Activities`,
    intro: (c) =>
      `${c.oneLiner} Christmas market walks, ice-skating tours, cold-weather food tastings, indoor cultural tours and cozy evening experiences in ${c.name} — the city at its most atmospheric.`,
    viatorQuery: (c) => `winter christmas market ${c.viatorQuery}`,
  },
  'with-kids': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-with-kids`,
    crumb: 'With kids',
    eyebrow: (c) => `${c.countryName} · with kids`,
    heading: (c) => `${c.name} with Kids: Family-Friendly Tours &amp; Activities`,
    intro: (c) =>
      `${c.oneLiner} Kid-safe, age-appropriate experiences in ${c.name} — zoos, aquariums, hands-on museums, kid-friendly walking tours, cooking classes. Bookable through Viator, most with free cancellation.`,
    viatorQuery: (c) => `kids family ${c.viatorQuery}`,
  },
  'with-teens': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-with-teens`,
    crumb: 'With teens',
    eyebrow: (c) => `${c.countryName} · with teens`,
    heading: (c) => `${c.name} with Teens: Cool Tours &amp; Activities That Don't Bore Them`,
    intro: (c) =>
      `${c.oneLiner} Escape rooms, food tours, adventure activities, photo walks, boat trips in ${c.name} — the experiences teens actually want to do (and won't ask to leave). All bookable in one tap.`,
    viatorQuery: (c) => `adventure escape food ${c.viatorQuery}`,
  },
  'airport-guide': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-airport-guide`,
    crumb: 'Airport guide',
    eyebrow: (c) => `${c.countryName} · airport guide`,
    heading: (c) => `${c.name} Airport Guide: Transfers, Lounges &amp; Layover Tips`,
    intro: (c) =>
      `${c.oneLiner} Airport transfers into ${c.name} city center, layover-safe day tours, luggage storage tips, and skip-the-line access to airport lounges. Everything you need before you land.`,
    viatorQuery: (c) => `airport transfer ${c.viatorQuery}`,
  },
  'budget-per-day': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-budget-per-day`,
    crumb: 'Budget per day',
    eyebrow: (c) => `${c.countryName} · budget`,
    heading: (c) => `${c.name} Budget Per Day: How Much Does a Trip Cost?`,
    intro: (c) =>
      `${c.oneLiner} What a day in ${c.name} costs — meals, transit, top attractions, and the bookable activities worth adding to the budget. Prices sourced from Viator listings, refreshed as they change.`,
    viatorQuery: (c) => `budget cheap ${c.viatorQuery}`,
  },
  'bachelor-party': {
    slugPrefix: 'bachelor-party-in-',
    crumb: 'Bachelor party',
    eyebrow: (c) => `${c.countryName} · bachelor party`,
    heading: (c) => `Bachelor Party in ${c.name}: The Complete Playbook`,
    intro: (c) =>
      `${c.oneLiner} Boat parties, brewery tours, poker experiences, adrenaline activities and nightlife tours in ${c.name} — the bachelor-party itinerary the best man will get credit for. All bookable through Viator.`,
    viatorQuery: (c) => `brewery boat party ${c.viatorQuery}`,
  },
  'bachelorette-party': {
    slugPrefix: 'bachelorette-party-in-',
    crumb: 'Bachelorette party',
    eyebrow: (c) => `${c.countryName} · bachelorette party`,
    heading: (c) => `Bachelorette Party in ${c.name}: The Ultimate Weekend`,
    intro: (c) =>
      `${c.oneLiner} Spa days, wine tours, photo shoots, cocktail-making classes and rooftop experiences in ${c.name} — the bachelorette weekend that photographs well and the group actually enjoys.`,
    viatorQuery: (c) => `spa wine cocktail ${c.viatorQuery}`,
  },
  'first-timer': {
    slugPrefix: 'first-time-in-',
    crumb: 'First-timer guide',
    eyebrow: (c) => `${c.countryName} · first visit`,
    heading: (c) => `First Time in ${c.name}: What to See & Do`,
    intro: (c) =>
      `${c.oneLiner} The essential first-timer's hit list for ${c.name} — the tours, tickets and experiences worth your limited days, all bookable in one place.`,
    viatorQuery: (c) => `${c.viatorQuery} top attractions`,
  },
  'worth-visiting': {
    slugPrefix: 'is-',
    slugFor: (c) => `is-${c.slug}-worth-visiting`,
    crumb: 'Worth visiting?',
    eyebrow: (c) => `${c.countryName} · honest take`,
    heading: (c) => `Is ${c.name} Worth Visiting?`,
    intro: (c) =>
      `${c.oneLiner} A straight answer on whether ${c.name} is worth the trip — what makes it special, who'll love it, and the experiences that seal the deal.`,
    viatorQuery: (c) => `${c.viatorQuery} top tours`,
  },
  'hidden-gems': {
    slugPrefix: 'hidden-gems-in-',
    crumb: 'Hidden gems',
    eyebrow: (c) => `${c.countryName} · off the beaten path`,
    heading: (c) => `Hidden Gems in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} The lesser-known corners of ${c.name} most tourists miss — offbeat tours and local-favorite experiences, bookable on the spot.`,
    viatorQuery: (c) => `${c.viatorQuery} hidden gems local`,
  },
  instagram: {
    slugPrefix: 'most-instagrammable-places-in-',
    crumb: 'Instagram spots',
    eyebrow: (c) => `${c.countryName} · photo spots`,
    heading: (c) => `Most Instagrammable Places in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} The most photogenic spots in ${c.name} and the photo tours, viewpoints and experiences that get you there at the right light.`,
    viatorQuery: (c) => `${c.viatorQuery} photo sightseeing tour`,
  },
  luxury: {
    slugPrefix: 'luxury-travel-in-',
    crumb: 'Luxury travel',
    eyebrow: (c) => `${c.countryName} · luxury`,
    heading: (c) => `Luxury Travel in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} The high-end side of ${c.name} — private guides, VIP access and premium experiences worth the splurge, all bookable in advance.`,
    viatorQuery: (c) => `luxury private ${c.viatorQuery}`,
  },
  'how-many-days': {
    slugPrefix: 'how-many-days-in-',
    crumb: 'How many days',
    eyebrow: (c) => `${c.countryName} · trip length`,
    heading: (c) => `How Many Days in ${c.name}?`,
    intro: (c) =>
      `${c.oneLiner} How long you actually need in ${c.name} — and the experiences to fill each day, whether you have a weekend or a week.`,
    viatorQuery: (c) => `${c.viatorQuery} top attractions`,
  },
  'solo-female': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-for-solo-female-travelers`,
    crumb: 'Solo female travel',
    eyebrow: (c) => `${c.countryName} · solo female travel`,
    heading: (c) => `${c.name} for Solo Female Travelers`,
    intro: (c) =>
      `${c.oneLiner} Solo-female-friendly small-group tours and experiences in ${c.name} — meet other travelers, stay safe, keep your independence.`,
    viatorQuery: (c) => `small group ${c.viatorQuery}`,
  },
  'bucket-list': {
    slugPrefix: '',
    slugFor: (c) => `${c.slug}-bucket-list`,
    crumb: 'Bucket list',
    eyebrow: (c) => `${c.countryName} · bucket list`,
    heading: (c) => `The ${c.name} Bucket List`,
    intro: (c) =>
      `${c.oneLiner} The once-in-a-lifetime experiences that define a ${c.name} trip — the bucket-list tours and tickets worth planning around.`,
    viatorQuery: (c) => `${c.viatorQuery} must see top`,
  },
  'private-tours': {
    slugPrefix: 'private-tours-in-',
    crumb: 'Private tours',
    eyebrow: (c) => `${c.countryName} · private tours`,
    heading: (c) => `Best Private Tours in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} Private, guide-to-yourself tours of ${c.name} — your pace, your interests, skip the crowds. All bookable on demand.`,
    viatorQuery: (c) => `private tour ${c.viatorQuery}`,
  },
  'walking-tours': {
    slugPrefix: 'walking-tours-in-',
    crumb: 'Walking tours',
    eyebrow: (c) => `${c.countryName} · walking tours`,
    heading: (c) => `Best Walking Tours in ${c.name}`,
    intro: (c) =>
      `${c.oneLiner} The best walking tours in ${c.name} — history, food, neighborhoods and hidden lanes on foot, led by local guides.`,
    viatorQuery: (c) => `walking tour ${c.viatorQuery}`,
  },
};

/**
 * schema.org `ItemList` of `TouristAttraction`s for the themed page.
 * Mirrors the things-to-do-seo-page JSON-LD with theme-specific
 * naming.
 */
export function buildThemedListJsonLd({
  city,
  theme,
  experiences,
  canonical,
}: {
  city: SeoCity;
  theme: ThemedListTheme;
  experiences: Experience[];
  canonical: string;
}): string {
  const meta = THEME_META[theme];
  const items = experiences.slice(0, 20).map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'TouristAttraction',
      name: e.title,
      description: e.summary,
      url: canonical,
      ...(e.photos[0]?.url ? { image: e.photos[0].url } : {}),
      ...(e.reviews.averageRating !== null && e.reviews.total > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: e.reviews.averageRating.toFixed(2),
              reviewCount: e.reviews.total,
              bestRating: '5',
              worstRating: '1',
            },
          }
        : {}),
    },
  }));

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: meta.heading(city),
    description: meta.intro(city),
    url: canonical,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: items.length,
    itemListElement: items,
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Per-theme GetYourGuide search-query resolvers. GYG's freetext
 * search is more forgiving than "family activities Tokyo" — natural
 * phrases with the theme + destination convert better.
 */
function gygDestinationFor(theme: ThemedListTheme, cityName: string): string {
  switch (theme) {
    case 'family':
      return `family activities in ${cityName}`;
    case 'food':
      return `food tours in ${cityName}`;
    case 'day-trips':
      return `day trips from ${cityName}`;
    case 'honeymoon':
      return `romantic couples experiences in ${cityName}`;
    case 'solo-travel':
      return `small group tours in ${cityName}`;
    case 'girls-trip':
      return `wine tasting spa ${cityName}`;
    case 'rainy-day':
      return `indoor activities museums cooking ${cityName}`;
    case 'night':
      return `evening tour nightlife ${cityName}`;
    case 'spring':
      return `spring garden festival ${cityName}`;
    case 'summer':
      return `summer boat rooftop ${cityName}`;
    case 'fall':
      return `autumn foliage harvest ${cityName}`;
    case 'winter':
      return `winter christmas market ${cityName}`;
    case 'with-kids':
      return `family kids activities in ${cityName}`;
    case 'with-teens':
      return `adventure escape food ${cityName}`;
    case 'airport-guide':
      return `airport transfer ${cityName}`;
    case 'budget-per-day':
      return `cheap budget ${cityName}`;
    case 'bachelor-party':
      return `brewery boat party in ${cityName}`;
    case 'bachelorette-party':
      return `spa wine cocktail in ${cityName}`;
    default:
      // Phase 11 themes (first-timer, hidden-gems, luxury, …) — a
      // broad "top experiences" query returns relevant GYG inventory.
      return `top experiences in ${cityName}`;
  }
}

function gygHeadingFor(theme: ThemedListTheme, cityName: string): string {
  switch (theme) {
    case 'family':
      return `Family-friendly activities in ${cityName}`;
    case 'food':
      return `Food tours & culinary experiences in ${cityName}`;
    case 'day-trips':
      return `Day trips from ${cityName}`;
    case 'honeymoon':
      return `Romantic experiences for couples in ${cityName}`;
    case 'solo-travel':
      return `Small-group tours & solo-friendly activities in ${cityName}`;
    case 'girls-trip':
      return `Wine, spa & photo tours in ${cityName}`;
    case 'rainy-day':
      return `Indoor experiences in ${cityName}`;
    case 'night':
      return `Evening tours & nightlife in ${cityName}`;
    case 'spring':
      return `Spring experiences in ${cityName}`;
    case 'summer':
      return `Summer experiences in ${cityName}`;
    case 'fall':
      return `Autumn experiences in ${cityName}`;
    case 'winter':
      return `Winter experiences in ${cityName}`;
    case 'with-kids':
      return `Family-friendly experiences in ${cityName}`;
    case 'with-teens':
      return `Teen-approved experiences in ${cityName}`;
    case 'airport-guide':
      return `${cityName} airport transfers & lounge access`;
    case 'budget-per-day':
      return `Budget-friendly experiences in ${cityName}`;
    case 'bachelor-party':
      return `Bachelor party experiences in ${cityName}`;
    case 'bachelorette-party':
      return `Bachelorette party experiences in ${cityName}`;
    default:
      return `Top experiences in ${cityName}`;
  }
}

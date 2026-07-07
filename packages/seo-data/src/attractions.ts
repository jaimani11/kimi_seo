import { findCityBySlug, type SeoCity } from './cities';

/**
 * Attraction pages — /attractions/{slug}.
 *
 * Each attraction gets its own indexable page with the practical
 * content that ranks for high-intent queries ("eiffel tower tickets",
 * "colosseum skip the line", "burj khalifa opening hours"). The page
 * combines hand-authored guidance with a live Viator inventory rail
 * for booking.
 *
 * Content is deliberately kept lean-but-real: opening hours, ticket
 * prices, skip-the-line advice, best time to visit, duration, transit,
 * FAQs. Enough to answer the question without filler that would earn
 * a thin-content penalty.
 */

export interface Attraction {
  /** URL slug. Lowercase, hyphenated, ASCII-safe. */
  slug: string;
  /** Display name. */
  name: string;
  /** SEO_CITIES slug this attraction is in. Used for internal linking
   *  back to the city's other SEO pages. */
  citySlug: string;
  /** Precise attraction coordinates for JSON-LD. */
  coordinates: { lat: number; lng: number };
  /** One-line editorial pitch. ≤140 chars. */
  oneLiner: string;
  /** 2-3 sentence intro that ranks for the attraction's main query. */
  fullDescription: string;
  /** Human-readable opening hours. Include closed days. */
  openingHours: string;
  /** Ticket price range in USD. */
  ticketPriceUSD: { from: number; to: number; note?: string };
  /** Skip-the-line advice — the actual, specific tactic that works. */
  skipTheLineAdvice: string;
  /** Best time of day / month to visit. */
  bestTimeToVisit: string;
  /** How long to plan for the visit. */
  durationHours: { min: number; max: number };
  /** Transit / getting-there advice. */
  gettingThere: string;
  /** Nearby food + coffee recommendations. */
  nearby: string;
  /** 5-8 FAQs — matches People Also Ask queries. */
  faqs: ReadonlyArray<{ q: string; a: string }>;
  /** Viator query for pulling live experiences to display. */
  viatorQuery: string;
}

export const ATTRACTIONS: readonly Attraction[] = [
  {
    slug: 'eiffel-tower',
    name: 'Eiffel Tower',
    citySlug: 'paris',
    coordinates: { lat: 48.8584, lng: 2.2945 },
    oneLiner: 'Paris\'s wrought-iron icon — 330m of Gustave Eiffel\'s riveted steel, elevator to the summit, twinkling on the hour after dark.',
    fullDescription:
      'The Eiffel Tower has been Paris\'s defining silhouette since 1889 — 330 metres of wrought-iron lattice with three visitor levels, elevators and stairs to the top, and a 5-minute sparkling light show every hour after sunset. The best summit views come 45 minutes before sunset when you can see Paris in daylight and again lit up as the sun sets. Bookings for elevator-to-summit tickets fill weeks ahead in peak season — reserve online before you travel, not on arrival.',
    openingHours: 'Daily 9:30am–11:45pm mid-June to early September; 9:30am–11:15pm rest of year. Last elevator up 45 minutes before close.',
    ticketPriceUSD: {
      from: 20,
      to: 50,
      note: 'Elevator to 2nd floor from ~€22 adult; elevator to summit from ~€45 adult; stairs to 2nd floor from ~€14. Under 4 free.',
    },
    skipTheLineAdvice:
      'Buy the elevator-to-summit ticket direct at toureiffel.paris up to 60 days ahead. If the site is sold out (common May–September), a Viator skip-the-line + guide combo is usually still available at 30-50% markup. Stairs (2nd floor only, cheap) rarely sell out — buy on arrival if you\'re fit.',
    bestTimeToVisit:
      'Late April–early June or September for weather + shorter lines. Time your visit for 45 minutes before sunset — you see Paris lit up as the sky changes.',
    durationHours: { min: 2, max: 3 },
    gettingThere:
      'Metro Bir-Hakeim (Line 6) or RER Champ de Mars-Tour Eiffel (Line C). Trocadéro (Line 6/9) for the classic postcard photo across the plaza before you cross the Seine.',
    nearby:
      'Champ de Mars picnic (grab supplies at Les Cocottes on rue Cler beforehand), café Le Recrutement Café for a post-visit drink, or dinner at Le Petit Cler for classic French bistro fare.',
    faqs: [
      {
        q: 'How much does it cost to visit the Eiffel Tower?',
        a: 'Adult tickets are ~€22 for the elevator to the 2nd floor and ~€45 for the elevator to the summit (~$24 and ~$49 USD respectively). Stairs to the 2nd floor cost from ~€14. Under 4 is free; 4-11 is ~half price.',
      },
      {
        q: 'Do I need to book Eiffel Tower tickets in advance?',
        a: 'Yes for the elevator to the summit — peak-season slots sell out weeks ahead on the official site (toureiffel.paris). If the direct site is sold out, guided skip-the-line tours via Viator or GetYourGuide almost always have availability at a 30–50% markup.',
      },
      {
        q: 'Are Eiffel Tower tickets refundable?',
        a: 'No — official Eiffel Tower tickets are non-refundable and non-exchangeable. Some Viator guided tours offer free cancellation up to 24 hours before.',
      },
      {
        q: 'How long do you need at the Eiffel Tower?',
        a: 'Plan 2–3 hours total: 30-60 minutes for security and elevator queues, 45-90 minutes on the tower itself (more if you\'re staying for the light show at nightfall).',
      },
      {
        q: 'What time is the Eiffel Tower light show?',
        a: 'The 5-minute sparkling light show runs every hour on the hour after sunset until 1am (11pm in winter). It\'s best viewed from Trocadéro or Champ de Mars.',
      },
      {
        q: 'Can you climb the stairs to the top of the Eiffel Tower?',
        a: 'Stairs go to the 2nd floor only (674 steps). The summit is elevator-only. Stair tickets are the cheapest and usually available without booking.',
      },
      {
        q: 'Is the Eiffel Tower open at night?',
        a: 'Yes — the last elevator up is 45 minutes before closing (which is 11:45pm in high season). Night visits are stunning; book the summit slot right after sunset.',
      },
    ],
    viatorQuery: 'Eiffel Tower Paris',
  },

  {
    slug: 'colosseum',
    name: 'Colosseum',
    citySlug: 'rome',
    coordinates: { lat: 41.8902, lng: 12.4922 },
    oneLiner: 'Rome\'s 50,000-seat amphitheater — arena floor tours, underground gladiator chambers, and skip-the-line combo tickets with the Forum + Palatine Hill.',
    fullDescription:
      'The Colosseum has been the icon of Rome for two thousand years — a 50,000-capacity Roman amphitheater completed in 80 AD, where gladiatorial games ran for four centuries. Standard admission includes the tiered seating levels; premium arena floor + underground tours (limited daily slots) walk you across the reconstructed floor and into the hypogeum where gladiators waited before combat. Standard tickets bundle Colosseum + Roman Forum + Palatine Hill on a single 24-hour pass — worth it, and the three are walkable one after another.',
    openingHours: 'Daily 9:00am until sunset (varies 4:30pm–7:15pm by month). Last admission 1 hour before close. Closed Dec 25 and Jan 1.',
    ticketPriceUSD: {
      from: 20,
      to: 90,
      note: 'Standard Colosseum + Forum + Palatine pass ~€18 (~$20); arena floor upgrade ~€28 (~$30); underground + arena guided ~€79 (~$85). Under 18 free.',
    },
    skipTheLineAdvice:
      'Book the "Full Experience" ticket 30+ days ahead on coopculture.it — the official site releases arena-floor + underground slots at midnight Rome time roughly a month out. If the official site is sold out, Viator and GetYourGuide guided tours include priority entry at ~50% markup.',
    bestTimeToVisit:
      'First slot of the day (9am, or 8:30am if that\'s offered April–October) for cool temperatures and fewer crowds. November–February is the quietest overall.',
    durationHours: { min: 2, max: 3 },
    gettingThere:
      'Metro Colosseo (Line B) exits at the ticket queue. Or a 15-minute walk from Piazza Venezia via the Via dei Fori Imperiali — the approach up the avenue is one of Rome\'s classic views.',
    nearby:
      'Coffee at Tazza d\'Oro or Sant\'Eustachio (near the Pantheon, 15-min walk); pizza al taglio at Bonci Pizzarium (metro to Cipro); dinner at Roscioli in the Ghetto for the essential Roman pastas.',
    faqs: [
      {
        q: 'How much are Colosseum tickets?',
        a: 'The standard 24-hour combo ticket (Colosseum + Roman Forum + Palatine Hill) is ~€18 for adults (~$20 USD). Under 18 is free. Arena floor access adds ~€10; underground guided tours run ~€79.',
      },
      {
        q: 'Do I need to book Colosseum tickets in advance?',
        a: 'Yes — regular tickets often sell out 5-7 days ahead in peak season. Arena floor and underground slots need to be booked 30+ days ahead on coopculture.it (the official site). If it\'s sold out, Viator/GetYourGuide tours almost always have availability.',
      },
      {
        q: 'Can you go inside the Colosseum?',
        a: 'Yes — all tickets include entry to the tiered seating levels. Only premium tickets include the arena floor and underground (hypogeum), which require a guide.',
      },
      {
        q: 'What is included in the Colosseum ticket?',
        a: 'The standard ticket is valid for 24 hours and includes the Colosseum, Roman Forum, and Palatine Hill on the same pass. You can visit each once.',
      },
      {
        q: 'How long do you need to visit the Colosseum?',
        a: 'Plan 1.5-2 hours for the Colosseum alone; 4-5 hours if you\'re doing the full Colosseum + Forum + Palatine combo in one visit.',
      },
      {
        q: 'Are there guided tours of the Colosseum?',
        a: 'Yes — official CoopCulture tours (arena + underground) and Viator/GetYourGuide small-group tours all run daily. Underground access is only available on a guided tour.',
      },
    ],
    viatorQuery: 'Colosseum Rome skip the line',
  },

  {
    slug: 'sagrada-familia',
    name: 'Sagrada Família',
    citySlug: 'barcelona',
    coordinates: { lat: 41.4036, lng: 2.1744 },
    oneLiner: 'Gaudí\'s unfinished modernist basilica — soaring nave lit by stained glass, tower elevators, and a scheduled completion in 2026.',
    fullDescription:
      'Antoni Gaudí\'s Sagrada Família has been under construction since 1882 and is on track for its 2026 completion — the year the last of its 18 towers is capped. Inside, the tree-like columns and stained-glass windows create the most photographed interior in Barcelona; late-afternoon sun (September to April) throws colored light directly across the nave. Tower elevator upgrades reach the Nativity or Passion façade tops for city views — bookable only in combination with your standard ticket.',
    openingHours: 'April–September 9:00am–8:00pm; November–February 9:00am–6:00pm; March + October 9:00am–7:00pm. Sunday morning worship service; visits from 10:30am on Sundays.',
    ticketPriceUSD: {
      from: 30,
      to: 55,
      note: 'Standard basilica entry ~€26 (~$28); with audio guide ~€30; with tower access ~€40 (~$44). Under 11 free.',
    },
    skipTheLineAdvice:
      'Book direct at sagradafamilia.org 60–90 days ahead for the best time slots (afternoon light is magical). Same-day walk-ups are almost never possible in high season. If direct is sold out, GetYourGuide skip-the-line tickets almost always have last-minute availability at a small markup.',
    bestTimeToVisit:
      'Late afternoon (roughly 3-5pm) between September and April — the west-facing stained glass on the Passion façade is at its brightest colored during those hours. Weekday mornings are quietest.',
    durationHours: { min: 1.5, max: 2.5 },
    gettingThere:
      'Metro Sagrada Família (Lines 2 + 5) exits at the front door. From Plaça Catalunya it\'s a 15-minute walk or 8-minute metro ride.',
    nearby:
      'Coffee at Slow Mov or Nomad Coffee Lab in Sant Antoni (3 metro stops); tapas at El Xampanyet in El Born (5 metro stops); dinner at Bar Cañete for high-end Catalan.',
    faqs: [
      {
        q: 'How much are Sagrada Família tickets?',
        a: 'Adult basilica entry is ~€26 (~$28 USD), audio-guide add-on ~€30, and with tower elevator access ~€40. Under 11 is free.',
      },
      {
        q: 'Do you need to book Sagrada Família tickets in advance?',
        a: 'Yes — the Sagrada Família sells out most days in high season. Book 60-90 days ahead on the official site (sagradafamilia.org) for the best time slots.',
      },
      {
        q: 'When will Sagrada Família be finished?',
        a: 'The final tower is scheduled for completion in 2026, on the centenary of Gaudí\'s death. Interior work will continue for years after that.',
      },
      {
        q: 'Can you go up the Sagrada Família towers?',
        a: 'Yes — with the tower access ticket you can take an elevator up either the Nativity façade tower or Passion façade tower for city views. You walk down via a narrow spiral staircase.',
      },
      {
        q: 'How long do you need at Sagrada Família?',
        a: 'Plan 1.5-2 hours for the basilica interior + museum; add 30 minutes if you\'re doing tower access.',
      },
      {
        q: 'Is Sagrada Família a church you can worship at?',
        a: 'Yes — it\'s an active Catholic basilica, consecrated in 2010. International Mass runs Sundays at 9am (limited seating for worshippers only).',
      },
    ],
    viatorQuery: 'Sagrada Familia Barcelona skip the line',
  },

  {
    slug: 'vatican-museums',
    name: 'Vatican Museums',
    citySlug: 'rome',
    coordinates: { lat: 41.9066, lng: 12.4534 },
    oneLiner: 'Vatican art collection ending at the Sistine Chapel — Raphael Rooms, Egyptian antiquities, and Michelangelo\'s ceiling.',
    fullDescription:
      'The Vatican Museums house one of the world\'s greatest art collections, culminating at the Sistine Chapel — Michelangelo\'s ceiling and Last Judgement. The standard route runs 5-7km through 54 rooms; most visitors spend 3-4 hours. Early-morning entry (7:30-8:00am, ticket + guide combos only) is the essential upgrade — you get 60-90 minutes in the Sistine Chapel before the crowds arrive.',
    openingHours: 'Monday–Saturday 9:00am–6:00pm (last entry 4pm). Closed Sundays except the last Sunday of the month (free entry, 9am–2pm — extremely crowded). Closed major religious holidays.',
    ticketPriceUSD: {
      from: 25,
      to: 90,
      note: 'Standard entry ~€22 (~$24); guided tour with skip-the-line ~€45-70 (~$50-75); early access (before 9am) ~€75-90.',
    },
    skipTheLineAdvice:
      'Book direct at museivaticani.va 30+ days ahead — the official reservation adds only €5 to the ticket price and lets you skip the outside line (which can be 2+ hours in June-August). For the Sistine Chapel with fewer crowds, book an early-access guided tour that enters before public opening — significantly more expensive but the room is nearly empty.',
    bestTimeToVisit:
      'Early access (7:30-8:00am) for the emptiest experience — book a guided tour that starts at that time. Otherwise, the first slot after 2pm (weekdays) is your best bet — most cruise-ship tour groups leave by then. Avoid Wednesday mornings (Papal audience crowds the area).',
    durationHours: { min: 3, max: 4 },
    gettingThere:
      'Metro Ottaviano-San Pietro (Line A) — 10-minute walk to the museum entrance. The main entrance is on Viale Vaticano, on the north side of Vatican City.',
    nearby:
      'Pizza al taglio at Bonci Pizzarium (5-minute walk from Cipro metro); espresso at Sciascia Caffè; dinner at Osteria da Fortunata in Prati (10-minute walk) for handmade pastas.',
    faqs: [
      {
        q: 'How much are Vatican Museums tickets?',
        a: 'Standard entry is ~€22 (~$24 USD) if booked online. Guided tours with skip-the-line entry run €45-70. Early access tours (before 9am) run €75-90.',
      },
      {
        q: 'Do I need to book Vatican Museums tickets in advance?',
        a: 'Yes, absolutely — walk-up queues can be 2+ hours in high season, and online tickets are only €5 more than the walk-up price. Book on museivaticani.va at least 30 days ahead.',
      },
      {
        q: 'Is the Vatican Museums entry the same as St. Peter\'s Basilica?',
        a: 'No — they\'re separate entries. Vatican Museums (with Sistine Chapel) enter from Viale Vaticano on the north side. St. Peter\'s Basilica has its own entry from St. Peter\'s Square, and is free to enter.',
      },
      {
        q: 'How long does it take to visit the Vatican Museums?',
        a: 'Plan 3-4 hours minimum — the standard route through to the Sistine Chapel covers 5-7km and 54 rooms.',
      },
      {
        q: 'Can you take photos in the Sistine Chapel?',
        a: 'No — photography and video are prohibited in the Sistine Chapel. Guards enforce it firmly. Photos are allowed in every other room.',
      },
      {
        q: 'When are the Vatican Museums free?',
        a: 'Entry is free on the last Sunday of each month, 9am-2pm. Expect crowds worse than any paid day — most people say it\'s not worth it unless you\'re on a tight budget.',
      },
    ],
    viatorQuery: 'Vatican Museums Sistine Chapel',
  },

  {
    slug: 'burj-khalifa',
    name: 'Burj Khalifa',
    citySlug: 'dubai',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    oneLiner: 'The world\'s tallest building at 828m — At the Top observation decks at levels 124/125 and 148, plus dinner at Atmosphere on 122.',
    fullDescription:
      'The Burj Khalifa stands 828 metres — the world\'s tallest building since its 2010 completion. Three visitor experiences: At the Top (levels 124/125, standard), At the Top SKY (levels 124/125/148, premium, includes gold-line access and refreshments), and dinner at Atmosphere on level 122. Sunset slots are the most sought-after — Dubai looks best when the golden hour hits the city and desert horizon.',
    openingHours: 'Daily 8:30am–11:00pm (At the Top). Last elevator up 45 minutes before closing.',
    ticketPriceUSD: {
      from: 45,
      to: 200,
      note: 'At the Top standard non-peak ~AED 169 (~$46); peak (sunset) ~AED 240 (~$65); At the Top SKY ~AED 385 (~$105); Atmosphere dinner ~AED 700+ (~$190+).',
    },
    skipTheLineAdvice:
      'Book direct at burjkhalifa.ae 2-3 weeks ahead for sunset slots (they sell out most days). Sunrise slots (rare — only offered some months) are cheaper and equally spectacular. Viator and GetYourGuide sell fast-track combos that skip the ticketing queue, mostly at only a modest markup.',
    bestTimeToVisit:
      'Sunset slot (30 minutes before sunset) — you see Dubai in daylight, at golden hour, and lit up after dark, all from the same visit. October to April for the clearest visibility.',
    durationHours: { min: 1.5, max: 2 },
    gettingThere:
      'Metro Burj Khalifa/Dubai Mall (Red Line) — 15-minute covered walkway from the metro to the Dubai Mall, then follow signs to Burj Khalifa entry. Or drop off at Dubai Mall\'s Grand Drop-off in a taxi.',
    nearby:
      'Dubai Mall for dinner + Dubai Fountain show (free, every 30 minutes 6pm-11pm); at.mosphere lounge (level 122) for a drink with the view; Dubai Aquarium & Underwater Zoo inside Dubai Mall for a lower-cost family option.',
    faqs: [
      {
        q: 'How much are Burj Khalifa tickets?',
        a: 'At the Top (levels 124/125) starts at ~AED 169 (~$46 USD) for non-peak times and ~AED 240 (~$65) for peak (sunset). At the Top SKY (adds level 148) is ~AED 385 (~$105). Under 4 is free.',
      },
      {
        q: 'Do I need to book Burj Khalifa tickets in advance?',
        a: 'Yes — sunset slots sell out days ahead in peak season (November-March). Book 2-3 weeks ahead on burjkhalifa.ae for guaranteed timing. Non-peak times can sometimes be booked same-day.',
      },
      {
        q: 'What\'s the difference between At the Top and At the Top SKY?',
        a: 'At the Top gets you levels 124 and 125 (outdoor + indoor decks). At the Top SKY adds level 148, refreshments, priority elevator access, and a private lounge. The extra height (~150m higher) makes a real difference — Dubai is much wider from 148.',
      },
      {
        q: 'What time is the best to visit Burj Khalifa?',
        a: 'The sunset slot (~30 minutes before sunset) is the top choice — you see Dubai in three different lights within an hour. October to April has the clearest visibility.',
      },
      {
        q: 'Can you eat at the top of Burj Khalifa?',
        a: 'Yes — Atmosphere restaurant + lounge on level 122 serves dinner (dressy) and lounge menu. Reservations essential. The lounge menu is cheaper than the restaurant and gives the same view.',
      },
      {
        q: 'How high can visitors go in Burj Khalifa?',
        a: 'Public access tops out at level 148 (555m) with the At the Top SKY ticket — the highest observation deck in the world. Levels above are private residences and the corporate suite.',
      },
    ],
    viatorQuery: 'Burj Khalifa Dubai At The Top',
  },

  {
    slug: 'louvre',
    name: 'The Louvre',
    citySlug: 'paris',
    coordinates: { lat: 48.8606, lng: 2.3376 },
    oneLiner: 'The Mona Lisa, the Venus de Milo, and 380,000 more works in the world\'s most-visited museum — timed entry, skip-the-line combos, and after-hours private tours.',
    fullDescription:
      'The Louvre draws 8-10 million visitors a year to see the Mona Lisa, the Winged Victory of Samothrace, and the Venus de Milo — plus another 35,000 works on display across the palace\'s 780,000 square feet. Timed entry is now mandatory; the standard visit takes 3-4 hours if you focus on the highlights. First-hour openings (9-10am) and after-6pm slots on Wednesday and Friday are the least crowded times.',
    openingHours: 'Wednesday, Thursday, Saturday–Monday 9am–6pm. Wednesday + Friday until 9:45pm (last entry 8:30pm). Closed Tuesdays, Dec 25, Jan 1, May 1.',
    ticketPriceUSD: {
      from: 22,
      to: 65,
      note: 'Standard timed entry ~€22 (~$24 USD); guided small-group tours €50–65. Under 18 free; free for EU residents 18–25.',
    },
    skipTheLineAdvice:
      'Book the timed entry ticket at louvre.fr 30+ days ahead. The Pyramid entrance is the tourist bottleneck; use the Carrousel du Louvre entrance (through the mall from Palais Royal metro) or the Porte des Lions entrance for shorter queues. Private guided tours through Viator include priority entry via a separate door.',
    bestTimeToVisit:
      'The first 9am slot on Wednesday, Thursday, Saturday, Sunday, or Monday. Friday nights after 6pm are quiet. Avoid Tuesdays (closed) and the two weeks around French school holidays (Toussaint, Christmas).',
    durationHours: { min: 3, max: 5 },
    gettingThere:
      'Metro Palais Royal–Musée du Louvre (Lines 1 + 7) exits directly under the Carrousel du Louvre entrance. RER C Musée d\'Orsay is a 10-minute walk across the Pont Royal.',
    nearby:
      'Coffee at Café Kitsuné or Café Marlette (both 5-10 min walk); classic bistro lunch at Chez la Vieille or Le Souffle for a Parisian classic; Angelina\'s famous hot chocolate on rue de Rivoli next door.',
    faqs: [
      {
        q: 'How much are Louvre tickets?',
        a: 'Standard timed-entry adult tickets are ~€22 (~$24 USD) if booked online. Guided small-group tours run €50-65. Under 18 is free, as are EU residents aged 18-25 with valid ID.',
      },
      {
        q: 'Do I need to book Louvre tickets in advance?',
        a: 'Yes — timed entry is now mandatory. Walk-up tickets exist but sell out most days by mid-morning. Book on louvre.fr 30+ days ahead for the best time slots.',
      },
      {
        q: 'How long does it take to see the Louvre?',
        a: 'The "highlights" run (Mona Lisa, Venus, Winged Victory, Napoleon III apartments) takes 2-3 hours. A serious visit is 4-5 hours. Coming back on a second day is common.',
      },
      {
        q: 'Is the Mona Lisa worth it?',
        a: 'Yes and no — the painting itself is smaller than expected and you\'ll be behind rails 4-5 meters back with a jostling crowd. The room around it (Salle des États) has three other Da Vincis worth seeing quietly.',
      },
      {
        q: 'Where is the Louvre in Paris?',
        a: 'On the Right Bank of the Seine in the 1st arrondissement, between Place du Carrousel and Rue de Rivoli. Metro Palais Royal-Musée du Louvre is the closest station.',
      },
      {
        q: 'Can you take photos in the Louvre?',
        a: 'Yes — photos allowed everywhere in the museum except in temporary exhibitions and where explicitly marked. No flash, no selfie sticks.',
      },
      {
        q: 'Which day is best to visit the Louvre?',
        a: 'Wednesday and Friday evenings (5-9:45pm) are the quietest slots. Weekday early mornings (9am opening) are also good. Weekends and school-holiday afternoons are the worst.',
      },
    ],
    viatorQuery: 'Louvre Museum Paris skip the line',
  },

  {
    slug: 'alhambra',
    name: 'The Alhambra',
    citySlug: 'granada',
    coordinates: { lat: 37.1761, lng: -3.5881 },
    oneLiner: 'Nasrid palaces, Generalife gardens, and Islamic architecture at its most refined — Andalusia\'s hilltop UNESCO wonder.',
    fullDescription:
      'The Alhambra is a fortress-palace complex built by the Nasrid emirs of Granada in the 13th–14th centuries — the finest Islamic architecture in Europe and one of Spain\'s three most-visited monuments. Standard tickets bundle the Alcazaba fortress, the Nasrid Palaces (timed slots), and the Generalife gardens on a single 3-hour visit. The Nasrid Palaces entry time is fixed and non-refundable — arrive at least 15 minutes early.',
    openingHours: 'Daily 8:30am–8:00pm (mid-March to mid-October); 8:30am–6:00pm rest of year. Night visits Tuesday–Saturday 22:00–23:30 (spring/summer).',
    ticketPriceUSD: {
      from: 20,
      to: 65,
      note: 'General Alhambra ticket (Palaces + Alcazaba + Generalife) ~€19 (~$21 USD); guided small-group tour with skip-the-line ~€45–65; night visits ~€10 (~$11).',
    },
    skipTheLineAdvice:
      'Book direct at alhambra-patronato.es or through Ticketmaster Spain 60–90 days ahead — tickets release in batches and sell out weeks in advance in peak season (April–October, plus Christmas). If direct is sold out, Viator and GetYourGuide guided tours are usually available even for next-day at ~50% markup.',
    bestTimeToVisit:
      'April–May and September–October — 20-25°C weather + walkable heat. Early morning (8:30am slot) has the softest light on the Nasrid Palace tiles. Avoid mid-July and August (35°C+) unless you take a night visit.',
    durationHours: { min: 3, max: 4 },
    gettingThere:
      'Bus C30 or C32 from central Granada (Plaza Isabel La Católica) — 10 minutes to the main entrance. Taxi from downtown is €8-10. On foot from Plaza Nueva via the Cuesta de Gomérez is a scenic 25-minute uphill walk.',
    nearby:
      'Tapas crawl in the Albayzín neighborhood (order a drink, food comes free with it at bars like Casa Julio); dinner at Ruta del Azafrán near the Alhambra hill; churros y chocolate at Café Fútbol on Plaza Mariana Pineda.',
    faqs: [
      {
        q: 'How much are Alhambra tickets?',
        a: 'General admission (Nasrid Palaces + Alcazaba + Generalife) is ~€19 (~$21 USD). Guided small-group tours with skip-the-line entry run €45-65. Night visits to just the Nasrid Palaces are €10. Under 12 free.',
      },
      {
        q: 'Do I need to book Alhambra tickets in advance?',
        a: 'Yes — the Alhambra caps daily visitors, and the Nasrid Palaces have timed 30-minute entry slots that sell out 60+ days ahead in peak season. Book on alhambra-patronato.es as soon as your dates are firm.',
      },
      {
        q: 'What time should I book my Nasrid Palaces slot?',
        a: 'The 8:30am slot has the fewest people and the softest light on the tiles. If early doesn\'t suit, aim for the last hour before closing (around 6pm summer, 4pm winter) — most tour groups leave by then.',
      },
      {
        q: 'How long do you need for the Alhambra?',
        a: 'Plan 3-4 hours minimum: 90 minutes for the Nasrid Palaces + Alcazaba + Palace of Charles V; another 60-90 minutes for the Generalife gardens across the ravine.',
      },
      {
        q: 'Is the Alhambra worth the hype?',
        a: 'Yes — it\'s the most beautiful and best-preserved Islamic architecture in Western Europe. The tile work in the Court of the Lions and the Sala de los Reyes is unlike anything else.',
      },
      {
        q: 'Can you visit the Alhambra at night?',
        a: 'Yes — night visits to the Nasrid Palaces run Tuesday–Saturday from 22:00 to 23:30 in high season (usually mid-March to mid-October). The tickets are €10 and give you the palaces almost to yourself.',
      },
    ],
    viatorQuery: 'Alhambra Granada skip the line',
  },

  {
    slug: 'machu-picchu',
    name: 'Machu Picchu',
    citySlug: 'cusco',
    coordinates: { lat: -13.1631, lng: -72.5450 },
    oneLiner: 'The 15th-century Inca citadel above the Urubamba Valley — sunrise from the Sun Gate, terraces cloaked in mountain mist.',
    fullDescription:
      'Machu Picchu was built around 1450 as a royal Inca estate, abandoned during Spanish conquest, and forgotten until 1911 — now the most-visited site in South America and a UNESCO World Heritage site. Tickets are strictly rationed (four fixed daily circuits × timed slots) and the standard visit takes 2-3 hours inside the site. Add-on Huayna Picchu or Mount Machu Picchu climbs are separate tickets that must be booked well in advance.',
    openingHours: 'Daily 6:00am–5:30pm (last entry 3:00pm). Timed circuits enter every 30 minutes.',
    ticketPriceUSD: {
      from: 45,
      to: 250,
      note: 'Basic timed entry ~S/152 (~$41 USD); with Huayna Picchu add-on ~S/200 (~$54); guided tours from Aguas Calientes ~S/450 (~$120); Inca Trail 4-day trek ~$800–1500.',
    },
    skipTheLineAdvice:
      'The site has a hard daily cap — book direct at machupicchu.gob.pe 3-6 months ahead for peak season (June-August). For the Huayna Picchu climb (400 daily slots), book 4-6 months ahead. Reputable Cusco tour operators (Alpaca Expeditions, Llama Path) can secure last-minute slots at a modest markup.',
    bestTimeToVisit:
      'April-May or September-October — dry season without peak-season crowds. Avoid January-March (heavy rain, sometimes closes the Inca Trail). The 6am first slot gives you the sunrise mist over the terraces; the 2pm slot has softer afternoon light.',
    durationHours: { min: 3, max: 6 },
    gettingThere:
      'Fly to Cusco → 90 min taxi/train to Ollantaytambo → 90 min PeruRail or Inca Rail train to Aguas Calientes → 30 min shuttle bus (or 90 min hike) to the site entrance. The full transfer takes 5-6 hours; most travelers overnight in Aguas Calientes or Ollantaytambo.',
    nearby:
      'Coffee at El Mapi Café in Aguas Calientes; alpaca skewers + Andean fusion at Indio Feliz (also in Aguas Calientes); Cusco\'s Chinchero, Pisac, and Ollantaytambo ruins for the Sacred Valley round trip.',
    faqs: [
      {
        q: 'How much does it cost to visit Machu Picchu?',
        a: 'Basic timed-entry adult tickets are S/152 (~$41 USD). Adding Huayna Picchu is ~S/200 (~$54). A full-day guided tour from Aguas Calientes runs S/450+ (~$120). Inca Trail treks are $800-1500.',
      },
      {
        q: 'Do I need to book Machu Picchu tickets in advance?',
        a: 'Absolutely — daily visitor caps apply and tickets sell out 2-6 months ahead in high season (June-August). The Huayna Picchu add-on is the tightest bottleneck; book those 4-6 months ahead.',
      },
      {
        q: 'How do you get to Machu Picchu?',
        a: 'Fly to Cusco → train to Ollantaytambo → train to Aguas Calientes → shuttle bus to the site entrance. Total 5-6 hours. Most travelers overnight in Aguas Calientes to catch the sunrise entry.',
      },
      {
        q: 'What is the best month to visit Machu Picchu?',
        a: 'May or September — dry season weather with fewer crowds than June-August peak. Avoid January-March (heavy rain, Inca Trail sometimes closes).',
      },
      {
        q: 'Do I need to acclimatize to altitude before Machu Picchu?',
        a: 'Yes — Cusco sits at 3,400m and altitude sickness is real. Plan 1-2 days in Cusco or lower in the Sacred Valley (Ollantaytambo, 2,800m) before hiking. Machu Picchu itself is only 2,430m — lower than Cusco.',
      },
      {
        q: 'Can you hike up to Machu Picchu?',
        a: 'Yes — the classic 4-day Inca Trail (limited to 500 people/day, permits book 6+ months ahead) or shorter alternatives (Salkantay, Lares treks). The bus from Aguas Calientes takes 30 minutes if you\'re not trekking.',
      },
    ],
    viatorQuery: 'Machu Picchu Peru',
  },

  {
    slug: 'angkor-wat',
    name: 'Angkor Wat',
    citySlug: 'siem-reap',
    coordinates: { lat: 13.4125, lng: 103.8670 },
    oneLiner: 'The 12th-century Khmer temple complex — a 1-day, 3-day, or 7-day pass for the world\'s largest religious monument.',
    fullDescription:
      'Angkor Wat is the crown jewel of the Angkor archaeological park — the 12th-century Khmer temple complex that features on Cambodia\'s national flag. A single visit day covers the "small circuit" (Angkor Wat + Bayon + Ta Prohm), or you can extend to 3-7 days to see outlying temples (Banteay Srei, Preah Khan, Beng Mealea). Sunrise over the reflecting pond at Angkor Wat is the essential moment — arrive by 5am to secure a spot.',
    openingHours: 'Angkor Wat 5:00am–5:30pm daily. Other temples 7:30am–5:30pm. Sunrise views require pre-5:30am entry with your park pass.',
    ticketPriceUSD: {
      from: 37,
      to: 200,
      note: '1-day Angkor Park pass $37; 3-day pass $62 (use within 10 days); 7-day pass $72 (use within 30 days). Tuk-tuk driver for the day $15-25; private car with English guide $60-100.',
    },
    skipTheLineAdvice:
      'Buy your Angkor Park pass at the official ticket center (5km east of Angkor Wat) the afternoon before your first visit — it\'s open until 5:30pm and processes 1-3 day passes on the spot with a photo. Multi-day passes are always available same-day. Skip touts offering to sell passes elsewhere; the official center is the only legitimate seller.',
    bestTimeToVisit:
      'November-February — dry season with cool mornings (18-25°C at sunrise) and no rain. March-May is hot (35°C+); June-October is the green season with brief afternoon storms but the greenest jungle around Ta Prohm. Sunrise (5:15am arrival) or late afternoon (3-5:30pm) for the softest light.',
    durationHours: { min: 4, max: 8 },
    gettingThere:
      'Siem Reap airport (REP) has direct flights from Bangkok, Ho Chi Minh City, Singapore. Tuk-tuks from central Siem Reap to Angkor Wat are $15-25 for a full day with a driver. Bicycles ($3/day) work for the small circuit but the heat is punishing.',
    nearby:
      'Amok curry at Cuisine Wat Damnak or Marum in Siem Reap; craft beer at Little Red Fox; Phare Cambodian Circus for evening entertainment. Dinner at Malis for high-end Khmer.',
    faqs: [
      {
        q: 'How much are Angkor Wat tickets?',
        a: '1-day Angkor Park pass is $37 USD. 3-day pass (use within 10 days) is $62. 7-day pass (use within 30 days) is $72. Passes cover 40+ temples across the park.',
      },
      {
        q: 'Do I need to book Angkor Wat tickets in advance?',
        a: 'No — passes are sold at the Angkor Enterprise ticket center (5km east of Siem Reap), open daily until 5:30pm. Buy your pass the afternoon before your first temple visit for a smoother sunrise start.',
      },
      {
        q: 'How many days do you need at Angkor Wat?',
        a: 'A serious visit is 3 days — Day 1: small circuit (Angkor Wat, Bayon, Ta Prohm). Day 2: grand circuit + Banteay Srei. Day 3: Beng Mealea, Kbal Spean, or a slow morning at Angkor Wat again. A rushed 1-day visit sees the highlights.',
      },
      {
        q: 'What time should I go to Angkor Wat?',
        a: 'Sunrise (5am arrival) is the essential moment — go on Day 1. Late-afternoon light (3-5:30pm) on Day 2 or 3 to see the west face lit up. Avoid mid-day (11am-2pm) when the sun is punishing and no shade exists.',
      },
      {
        q: 'Where is Angkor Wat?',
        a: 'In Siem Reap Province in northwestern Cambodia — 6km north of downtown Siem Reap. The Angkor archaeological park stretches across 400 square kilometers with 40+ temples.',
      },
      {
        q: 'Can you climb the towers at Angkor Wat?',
        a: 'Yes — the central sanctuary Bakan is climbable via steep wooden stairs for a small extra queue. Only limited numbers can climb at once; shorts (knee-length) and sleeves are required for entry.',
      },
    ],
    viatorQuery: 'Angkor Wat Cambodia',
  },

  {
    slug: 'petra',
    name: 'Petra',
    citySlug: 'petra',
    coordinates: { lat: 30.3285, lng: 35.4444 },
    oneLiner: 'The rose-red Nabataean city carved into desert cliffs — Treasury, Monastery, and the Siq walk that never ages.',
    fullDescription:
      'Petra is a 2,500-year-old Nabataean capital carved into sandstone cliffs in southern Jordan — one of the New Seven Wonders and a UNESCO World Heritage site. The 1.2 km Siq (a natural gorge) leads to the Treasury facade (the "Indiana Jones" shot). A serious visit covers the Treasury, the Roman theater, the tombs, and the 800-step climb to the Monastery — roughly 8-10 km on foot. Petra by Night (Mondays, Wednesdays, Thursdays) lights the Siq with 1,500 candles.',
    openingHours: 'Daily 6:00am–6:00pm (summer); 6:00am–4:00pm (winter). Petra by Night 8:30pm–10:30pm on Monday, Wednesday, Thursday.',
    ticketPriceUSD: {
      from: 70,
      to: 130,
      note: '1-day Petra ticket JOD 50 (~$70); 2-day JOD 55; 3-day JOD 60. Petra by Night JOD 17 (~$24). Jordan Pass ($99) covers Petra + visa + other sites.',
    },
    skipTheLineAdvice:
      'The Jordan Pass ($99, sold at jordanpass.jo) covers Petra + 40+ other sites + waives the Jordanian visa fee — worth it if you\'re staying 3+ nights. Petra doesn\'t sell out; tickets are always available on arrival. The bottleneck is heat + fatigue, not queues — book a horse or donkey ride for the Monastery climb if you don\'t want the 800 steps.',
    bestTimeToVisit:
      'March-May or September-November — 15-28°C temperatures. Avoid mid-June to mid-September (35°C+ desert heat makes the 8-hour walk brutal). Enter at 6am for the best light on the Treasury and to reach the Monastery before mid-day sun.',
    durationHours: { min: 6, max: 10 },
    gettingThere:
      'Fly to Amman (Queen Alia airport, AMM) → 3.5 hours by rental car or private driver to Petra (Wadi Musa town). Public buses (JETT) run from Amman → Petra daily. Most travelers overnight in Wadi Musa hotels adjacent to the entrance.',
    nearby:
      'Lunch at Basin Restaurant inside the archaeological park; dinner at My Mom\'s Recipe or Al-Qantarah in Wadi Musa for genuine mansaf (Jordan\'s national dish). Coffee at Cave Bar (built inside a 2,000-year-old Nabataean tomb — no, seriously) for a memorable sundown.',
    faqs: [
      {
        q: 'How much are Petra tickets?',
        a: 'A 1-day Petra ticket is JOD 50 (~$70 USD). 2-day is JOD 55, 3-day is JOD 60. Petra by Night is JOD 17. The Jordan Pass ($99) bundles Petra + visa fee waiver + other sites.',
      },
      {
        q: 'Do I need to book Petra tickets in advance?',
        a: 'No — tickets are always available at the entrance ticket office. The visitor center opens at 6am; buy your ticket, walk to the Siq, and start the visit. Petra by Night tickets can be bought at the same office earlier in the day.',
      },
      {
        q: 'How long do you need at Petra?',
        a: 'A minimum of 6-8 hours for a full day (Treasury + Royal Tombs + Monastery climb). Two days lets you split the highlights and take the "Back Trail" from Little Petra to the Monastery for a quiet afternoon.',
      },
      {
        q: 'Is Petra worth the visit?',
        a: 'Yes — it\'s one of the most spectacular archaeological sites in the world. The Siq walk to the Treasury is legendary, and the Monastery hike (800 steps) rewards with a bigger, quieter, more atmospheric facade.',
      },
      {
        q: 'Can you go inside the Treasury at Petra?',
        a: 'No — the Treasury (Al-Khazneh) is a facade only; the interior is a small empty chamber not open to visitors. Some other tombs (Urn Tomb, Royal Tombs) you can walk into.',
      },
      {
        q: 'How much walking is involved at Petra?',
        a: 'A full-day visit is 8-10km on foot with some steep climbs. The 800-step Monastery ascent is optional but rewarding. Donkeys and horses (extra fee) can carry you up the Monastery and back from the entrance to the Treasury.',
      },
    ],
    viatorQuery: 'Petra Jordan tour',
  },
];

const BY_SLUG = new Map<string, Attraction>(ATTRACTIONS.map((a) => [a.slug, a]));

/** Look up an attraction by slug — the same shape used by findCityBySlug. */
export function findAttractionBySlug(slug: string): Attraction | null {
  return BY_SLUG.get(slug) ?? null;
}

/** All attractions — used by generateStaticParams and the sitemap. */
export function allAttractions(): readonly Attraction[] {
  return ATTRACTIONS;
}

/** Load the city record for an attraction (used for breadcrumbs + linking). */
export function cityFor(attraction: Attraction): SeoCity | null {
  return findCityBySlug(attraction.citySlug);
}

/** All attractions in a city — map pins + walking-distance callouts. */
export function attractionsByCity(citySlug: string): readonly Attraction[] {
  return ATTRACTIONS.filter((a) => a.citySlug === citySlug);
}

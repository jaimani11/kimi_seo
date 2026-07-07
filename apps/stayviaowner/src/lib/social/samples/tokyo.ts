import type { CitySocialPack } from '../types';

/**
 * Hand-authored social pack for Tokyo — used as the "demo" path of
 * the generator so the admin UI can show realistic, posting-ready
 * content without burning Anthropic tokens or needing an API key.
 *
 * Other cities get either the LLM (Anthropic) or the deterministic
 * template generator, both of which produce decent output but neither
 * matches a hand-curated Tokyo pack. As content gets curated for more
 * cities, add a sibling file here and register it in
 * `findSampleFor` in `../generator.ts`.
 */
export const TOKYO_SAMPLE_PACK: CitySocialPack = {
  citySlug: 'tokyo',
  cityName: 'Tokyo',
  generatedAt: '2026-06-12T00:00:00.000Z',
  source: 'sample',
  pinterest: [
    {
      platform: 'pinterest',
      title: 'The Perfect 3-Day Tokyo Itinerary',
      description:
        'A day-by-day 3-day plan for first-time Tokyo: Shibuya scramble, Senso-ji at dawn, omakase counter, izakaya alleys, sumo-style brunch. Built around real Viator picks you can reserve in one tap.',
      visualConcept:
        'Aerial of Shibuya Crossing at dusk with neon trails, overlay text "3 DAYS IN TOKYO" in stayviaowner coral.',
      hashtags: ['#tokyo', '#tokyotravel', '#japan', '#3dayitinerary', '#stayviaowner'],
      cta: 'Plan your 3-day Tokyo trip free on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: '5 Days in Tokyo: The Complete Guide',
      description:
        'Five carefully sequenced days: arrival + Shinjuku night, Asakusa to Yanaka, a Hakone day trip, food districts in Tsukiji + Ebisu, farewell sushi counter in Ginza. All bookable.',
      visualConcept:
        'Photo grid — five panels showing one signature moment per day (ramen, temple, onsen, sushi, skyline).',
      hashtags: ['#tokyo', '#tokyoitinerary', '#japantravel', '#5days', '#stayviaowner'],
      cta: 'Get the 5-day plan on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: '7 Days in Tokyo (without burning out)',
      description:
        'A week in Tokyo at a pace that respects your jet lag — neighborhood deep-dives, a Mt. Fuji morning, a sumo experience, an offbeat Kichijoji day. Real reservations, real pacing.',
      visualConcept:
        'Wide cinematic Mt. Fuji + Tokyo skyline composite, overlay text "ONE WEEK IN TOKYO".',
      hashtags: ['#tokyo', '#tokyoweek', '#japan', '#7dayitinerary', '#stayviaowner'],
      cta: 'Build your week-long Tokyo plan on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'When to Visit Tokyo (peak vs. shoulder)',
      description:
        'March 25 – April 5 is cherry-blossom peak. Late October – mid-November is maple foliage. Summer is humid; winter is dry and underrated. We break down each window with crowds + price.',
      visualConcept:
        'Split-screen: cherry blossoms on left, autumn maple on right, overlay text "BEST TIME: SPRING / FALL".',
      hashtags: ['#tokyo', '#besttimetovisit', '#cherryblossom', '#travelplanning', '#stayviaowner'],
      cta: 'See the full Tokyo seasonal guide on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'Tokyo on a Budget: $50, $120, $350/day',
      description:
        'Backpacker $50: hostel + convenience store + standing ramen. Mid $120: capsule + omakase counter + private cooking class. Luxury $350: Park Hyatt + Sukiyabashi Jiro + private guide.',
      visualConcept:
        'Three-column pin: BUDGET / MID / LUXURY with a representative photo + price under each.',
      hashtags: ['#tokyo', '#budgettravel', '#japanbudget', '#travelhacks', '#stayviaowner'],
      cta: 'Compare Tokyo budgets on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'What to Eat in Tokyo: A 10-Dish Tour',
      description:
        'Ramen, sushi, tempura, yakitori, soba, tonkatsu, monjayaki, wagashi, taiyaki, and the obligatory 7-Eleven egg sando. With venue recs for each dish that won’t leave you queuing two hours.',
      visualConcept:
        'Top-down hero of an omakase counter mid-service, sushi plated dark and moody.',
      hashtags: ['#tokyo', '#tokyofood', '#japanfood', '#foodie', '#stayviaowner'],
      cta: 'Get the Tokyo food map free on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'Where to Stay in Tokyo: 4 Neighborhoods Compared',
      description:
        'Shibuya for energy. Asakusa for old Tokyo + cheaper hotels. Shinjuku for transit + nightlife. Shimokitazawa for indie cafés + walkability. Match the neighborhood to the trip.',
      visualConcept:
        'Stylized Tokyo map with four neighborhoods highlighted in stayviaowner brand colors, each with an icon.',
      hashtags: ['#tokyo', '#wheretostay', '#tokyohotels', '#neighborhoodguide', '#stayviaowner'],
      cta: 'Compare Tokyo neighborhoods on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'Tokyo with Kids: A Family Day Plan',
      description:
        'Pokémon Café, teamLab Planets, Ueno Zoo, Edo-Tokyo Museum, Disneyland or DisneySea — sequenced so nobody melts down. Plus kid-friendly restaurants that don’t treat you like a circus act.',
      visualConcept:
        'Bright daylight shot of a family at teamLab Planets, kids reaching toward floating lanterns.',
      hashtags: ['#tokyo', '#familytravel', '#tokyowithkids', '#travelwithkids', '#stayviaowner'],
      cta: 'Plan your Tokyo family trip on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'A Romantic Weekend in Tokyo',
      description:
        'Park Hyatt sunset, a private sushi counter, a kimono-rental afternoon, and a long walk through Yanaka. Built for couples who’d rather skip the bus tours.',
      visualConcept:
        'Two figures on a rooftop bar at golden hour, Tokyo skyline behind, intimate framing.',
      hashtags: ['#tokyo', '#romanticgetaway', '#couplestravel', '#tokyoweekend', '#stayviaowner'],
      cta: 'Plan a Tokyo couples weekend on stayviaowner.com',
    },
    {
      platform: 'pinterest',
      title: 'Solo in Tokyo: The Friendliest Mega-City',
      description:
        'Every counter has a seat for one. Ramen at Ichiran. Standing bars in Memory Lane. A solo onsen day in Hakone. A neighborhood that lets you disappear and a city that gives you back to yourself.',
      visualConcept:
        'Solo diner at a ramen counter, chef’s hands in motion, warm yellow light.',
      hashtags: ['#tokyo', '#solotravel', '#solofemaletravel', '#tokyosolo', '#stayviaowner'],
      cta: 'Plan your solo Tokyo trip on stayviaowner.com',
    },
  ],
  tiktok: [
    {
      platform: 'tiktok',
      hook: 'Don’t go to Tokyo without doing these 3 things 🍜',
      scenes: [
        {
          visual: 'Close-up of tonkotsu ramen being assembled — pour shot of broth.',
          text: '#1: Standing ramen',
          voiceover: 'A standing ramen counter at midnight. Five minutes in, five minutes out, life-changing.',
        },
        {
          visual: 'Senso-ji at 6am, empty, pink dawn light, lantern swinging.',
          text: '#2: Senso-ji at dawn',
          voiceover: 'Senso-ji before sunrise — no crowds, just lanterns and incense.',
        },
        {
          visual: 'Shibuya Crossing from above, time-lapse of one full light cycle.',
          text: '#3: The scramble — twice',
          voiceover: 'Cross Shibuya once for the photo. Cross it again at night, just to feel it.',
        },
      ],
      cta: 'Save this and plan free on stayviaowner.com — link in bio.',
      durationSec: 22,
      musicCue: 'uplifting lo-fi beat with Tokyo-night ambience',
      hashtags: [
        '#tokyo',
        '#tokyotravel',
        '#tokyotok',
        '#japantravel',
        '#mustdo',
        '#travelhacks',
        '#stayviaowner',
      ],
    },
    {
      platform: 'tiktok',
      hook: 'POV: it’s your first day in Tokyo and you don’t know where to start.',
      scenes: [
        {
          visual: 'Morning at a convenience-store breakfast — egg sando, hot coffee.',
          text: 'Morning: 7-Eleven',
          voiceover: 'Start at a 7-Eleven. Egg sando, coffee, no jet-lag heroics yet.',
        },
        {
          visual: 'Walking through Yanaka old town, narrow lanes, cats.',
          text: 'Midday: Yanaka',
          voiceover: 'Walk Yanaka while you’re still tired. It’s the calmest, oldest part.',
        },
        {
          visual: 'Sunset at Shibuya Sky observation deck.',
          text: 'Golden hour: Shibuya Sky',
          voiceover: 'Sunset from Shibuya Sky. Book the ticket in the morning.',
        },
        {
          visual: 'Late-night izakaya scene — beer pour, yakitori on grill.',
          text: 'Night: izakaya',
          voiceover: 'Finish at an izakaya. Yakitori, beer, sleep at 10.',
        },
      ],
      cta: 'Free Tokyo day-1 plan at stayviaowner.com — link in bio.',
      durationSec: 26,
      musicCue: 'cinematic ambient with light percussion',
      hashtags: ['#tokyo', '#tokyovlog', '#japan', '#travelpov', '#dayinthelife', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Tokyo neighborhoods, ranked by vibe 🏙️',
      scenes: [
        {
          visual: 'Shibuya at night — neon, scramble, crowds.',
          text: '1. Shibuya — electric',
          voiceover: 'Shibuya is the energy. Stay here if you want to feel it.',
        },
        {
          visual: 'Asakusa daytime — temple, rickshaws, low buildings.',
          text: '2. Asakusa — old Tokyo',
          voiceover: 'Asakusa is old Tokyo. Cheap hotels, walkable, calmer.',
        },
        {
          visual: 'Shimokitazawa — vintage shops, cafés, indie energy.',
          text: '3. Shimokitazawa — indie',
          voiceover: 'Shimokita is the cool kids’ pick. Cafés, records, slow days.',
        },
        {
          visual: 'Shinjuku — transit hub at night, neon.',
          text: '4. Shinjuku — transit + nightlife',
          voiceover: 'Shinjuku for trains and bars. Save it for the second half.',
        },
      ],
      cta: 'Compare them in detail on stayviaowner.com — link in bio.',
      durationSec: 24,
      musicCue: 'high-energy electronic, festival vibe',
      hashtags: ['#tokyo', '#tokyoneighborhoods', '#wheretostay', '#tokyohotels', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Is Tokyo expensive? Here’s the honest math 💸',
      scenes: [
        {
          visual: 'Convenience-store haul on a table — onigiri, sandwiches, drink.',
          text: 'Budget: $50/day',
          voiceover: 'On $50 you’re eating konbini and riding the metro. It still works.',
        },
        {
          visual: 'Mid-range izakaya scene — yakitori, beer, friends.',
          text: 'Mid: $120/day',
          voiceover: 'On $120 you’re in a capsule or business hotel and eating well.',
        },
        {
          visual: 'Park Hyatt lobby + omakase counter close-up.',
          text: 'Luxury: $350/day',
          voiceover: 'On $350 you’re at the Park Hyatt with an omakase counter waiting.',
        },
      ],
      cta: 'Pick your tier on stayviaowner.com — link in bio.',
      durationSec: 20,
      musicCue: 'jazzy upbeat lounge',
      hashtags: ['#tokyo', '#tokyobudget', '#budgettravel', '#travelmoney', '#japan', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Tokyo food crawl, 5 stops, under $40 🍣',
      scenes: [
        {
          visual: 'Tsukiji outer market — tamagoyaki being grilled.',
          text: '1. Tsukiji tamagoyaki',
          voiceover: 'Start at Tsukiji. Tamagoyaki on a stick, $2.',
        },
        {
          visual: 'Standing ramen counter, slurping shot.',
          text: '2. Standing ramen',
          voiceover: 'Standing ramen for lunch. $8 and the best of your week.',
        },
        {
          visual: 'Coffee + matcha parfait at a third-wave café.',
          text: '3. Matcha parfait',
          voiceover: 'Matcha parfait at a Shibuya café. $7, treat yourself.',
        },
        {
          visual: 'Memory Lane yakitori at sunset, smoke rising.',
          text: '4. Yakitori alley',
          voiceover: 'Yakitori in Memory Lane. Six skewers, $12.',
        },
        {
          visual: 'Conveyor sushi at night, plates stacked.',
          text: '5. Sushi belt',
          voiceover: 'Finish at conveyor sushi. $10 and bedtime.',
        },
      ],
      cta: 'Save this crawl. Link in bio — stayviaowner.com.',
      durationSec: 28,
      musicCue: 'upbeat j-pop instrumental',
      hashtags: ['#tokyo', '#tokyofood', '#japanfood', '#streetfood', '#foodcrawl', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Going to Tokyo solo? Watch this first 🎒',
      scenes: [
        {
          visual: 'Solo traveler ordering at a ramen counter — friendly chef.',
          text: 'Every counter has a seat for 1',
          voiceover: 'Tokyo is the friendliest big city for solo. Every counter has a seat for one.',
        },
        {
          visual: 'Solo guest at a capsule hotel check-in.',
          text: 'Capsule hotels are great',
          voiceover: 'Capsule hotels are clean, cheap, and made for solo travelers.',
        },
        {
          visual: 'Map showing safe late-night areas — Shibuya, Shinjuku highlighted.',
          text: 'Safety: very high',
          voiceover: 'Tokyo is one of the safest huge cities in the world. Walk home at 2am, you’re fine.',
        },
      ],
      cta: 'Get the solo Tokyo plan on stayviaowner.com — link in bio.',
      durationSec: 22,
      musicCue: 'mellow lo-fi with light synths',
      hashtags: ['#tokyo', '#solotravel', '#tokyosolo', '#solofemaletraveler', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'I went to Tokyo with my kids and here’s what worked 👨‍👩‍👧‍👦',
      scenes: [
        {
          visual: 'Pokémon Café — kids excited over Pikachu plate.',
          text: 'Pokémon Café (book ahead)',
          voiceover: 'Pokémon Café — book 31 days out at 6pm sharp.',
        },
        {
          visual: 'teamLab Planets — kids reaching into floating lanterns.',
          text: 'teamLab Planets',
          voiceover: 'teamLab Planets — bare feet, water, sensory wonder.',
        },
        {
          visual: 'Family at a Ueno-park family ramen lunch.',
          text: 'Family-friendly ramen',
          voiceover: 'Family ramen at Ippudo — kid-sized portions exist.',
        },
      ],
      cta: 'Family Tokyo plan free on stayviaowner.com — link in bio.',
      durationSec: 22,
      musicCue: 'cheerful uplifting indie',
      hashtags: ['#tokyo', '#tokyowithkids', '#familytravel', '#travelwithkids', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Tokyo tickets that actually book out — set reminders 🗓️',
      scenes: [
        {
          visual: 'Phone calendar app with reminders set.',
          text: 'Ghibli Museum',
          voiceover: 'Ghibli Museum opens tickets on the 10th at 10am sharp. They sell out in minutes.',
        },
        {
          visual: 'teamLab Planets entrance line.',
          text: 'teamLab Planets',
          voiceover: 'teamLab Planets sells out two weeks ahead in peak season.',
        },
        {
          visual: 'Shibuya Sky observation deck at sunset.',
          text: 'Shibuya Sky sunset slot',
          voiceover: 'Shibuya Sky sunset slots go fast. Book the morning you arrive.',
        },
      ],
      cta: 'Plan + book on stayviaowner.com — link in bio.',
      durationSec: 18,
      musicCue: 'tense uplifting electronic',
      hashtags: ['#tokyo', '#travelplanning', '#tokyohacks', '#traveltips', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Tokyo at night vs Tokyo at dawn 🌅',
      scenes: [
        {
          visual: 'Shibuya at midnight — neon, traffic, crowd.',
          text: 'Midnight Shibuya',
          voiceover: 'Tokyo at midnight is unstoppable.',
        },
        {
          visual: 'Same Shibuya at 5am — empty, gray, calm.',
          text: '5am — same place',
          voiceover: 'Tokyo at 5am is the city resting.',
        },
        {
          visual: 'Senso-ji at first light, monk sweeping path.',
          text: 'Senso-ji, first light',
          voiceover: 'Set an alarm for 5:30 once. You’ll never forget it.',
        },
      ],
      cta: 'Get the perfect Tokyo day on stayviaowner.com — link in bio.',
      durationSec: 20,
      musicCue: 'cinematic ambient strings',
      hashtags: ['#tokyo', '#tokyonight', '#tokyodawn', '#travelvideo', '#stayviaowner'],
    },
    {
      platform: 'tiktok',
      hook: 'Mistakes I made in Tokyo so you don’t have to ❌',
      scenes: [
        {
          visual: 'Buying a JR Pass at the JR ticket window.',
          text: 'JR Pass isn’t always worth it',
          voiceover: 'The JR Pass isn’t worth it for a Tokyo-only trip. Just use Suica.',
        },
        {
          visual: 'Eating ramen at 1pm at an empty popular spot.',
          text: 'Eat lunch at 11 or 2',
          voiceover: 'Popular spots queue 12–1:30. Eat at 11 or after 2.',
        },
        {
          visual: 'Carrying a giant suitcase up a subway staircase.',
          text: 'Smaller suitcase',
          voiceover: 'Many subway stations have stairs. Pack smaller than you think.',
        },
      ],
      cta: 'Get smart Tokyo tips on stayviaowner.com — link in bio.',
      durationSec: 22,
      musicCue: 'punchy lo-fi with vocal sample',
      hashtags: ['#tokyo', '#travelmistakes', '#tokyotips', '#travelhacks', '#stayviaowner'],
    },
  ],
  reels: [
    {
      platform: 'instagram-reels',
      hook: 'Tokyo in 60 seconds — bookmark this 📌',
      scenes: [
        {
          visual: 'Shibuya scramble, time-lapse at golden hour.',
          text: 'Shibuya',
          voiceover: 'Start in Shibuya for the energy.',
        },
        {
          visual: 'Asakusa morning, lanterns, low light.',
          text: 'Asakusa',
          voiceover: 'Wake early for Asakusa.',
        },
        {
          visual: 'Tsukiji outer market food close-ups.',
          text: 'Tsukiji',
          voiceover: 'Eat through Tsukiji’s outer market.',
        },
        {
          visual: 'Shibuya Sky sunset panorama.',
          text: 'Sunset: Shibuya Sky',
          voiceover: 'Sunset from Shibuya Sky.',
        },
        {
          visual: 'Late-night izakaya scene, beer pour.',
          text: 'Night: izakaya',
          voiceover: 'Finish at an izakaya.',
        },
      ],
      cta: 'Full Tokyo plan on stayviaowner.com.',
      durationSec: 28,
      musicCue: 'dreamy indie-pop, mid-tempo',
      hashtags: ['#tokyo', '#tokyoreels', '#japan', '#travelreels', '#travelinspo', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'You came for the food, didn’t you 🍜',
      scenes: [
        {
          visual: 'Counter ramen, slurp shot, steam.',
          text: 'Ramen',
          voiceover: 'Counter ramen first.',
        },
        {
          visual: 'Omakase sushi assembly close-up.',
          text: 'Omakase',
          voiceover: 'Save up for one omakase.',
        },
        {
          visual: 'Tempura being lifted from oil.',
          text: 'Tempura',
          voiceover: 'Standing tempura is the move.',
        },
        {
          visual: 'Yakitori grill close-up at sunset.',
          text: 'Yakitori',
          voiceover: 'Yakitori under red lanterns.',
        },
        {
          visual: 'Matcha parfait in a Shibuya café.',
          text: 'Wagashi + matcha',
          voiceover: 'End sweet at a tea house.',
        },
      ],
      cta: 'Tokyo food map on stayviaowner.com.',
      durationSec: 26,
      musicCue: 'jazzy lounge, food-show energy',
      hashtags: ['#tokyofood', '#japanfood', '#foodreels', '#tokyoeats', '#foodie', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Best time to visit Tokyo (do not guess) 🌸',
      scenes: [
        {
          visual: 'Cherry blossom park in full bloom, picnic mats.',
          text: 'Spring: late March – early April',
          voiceover: 'Spring peaks late March through the first week of April.',
        },
        {
          visual: 'Maple foliage in Kyoto-style garden.',
          text: 'Fall: late Oct – mid Nov',
          voiceover: 'Fall foliage peaks late October to mid-November.',
        },
        {
          visual: 'Cold winter morning at a quiet shrine.',
          text: 'Winter is underrated',
          voiceover: 'Winter is dry, cheap, and underrated.',
        },
      ],
      cta: 'See the full seasonal guide on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'soft acoustic guitar, sunset mood',
      hashtags: ['#tokyo', '#besttimetovisit', '#cherryblossom', '#travelplanning', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Where to stay in Tokyo (saved you 4 hours of research) 🏨',
      scenes: [
        {
          visual: 'Shibuya hotel window view at night.',
          text: 'Shibuya: energy',
          voiceover: 'Shibuya if you want energy.',
        },
        {
          visual: 'Asakusa traditional ryokan facade.',
          text: 'Asakusa: old Tokyo, cheaper',
          voiceover: 'Asakusa for old Tokyo and cheaper rooms.',
        },
        {
          visual: 'Shinjuku skyline at night from a hotel.',
          text: 'Shinjuku: transit + bars',
          voiceover: 'Shinjuku for transit and nightlife.',
        },
        {
          visual: 'Shimokitazawa indie café exterior.',
          text: 'Shimokitazawa: walkable indie',
          voiceover: 'Shimokita if you want indie and walkable.',
        },
      ],
      cta: 'Compare Tokyo neighborhoods on stayviaowner.com.',
      durationSec: 22,
      musicCue: 'cinematic ambient with light percussion',
      hashtags: ['#tokyohotels', '#wheretostay', '#tokyoneighborhoods', '#travelreels', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'A perfect Sunday in Tokyo ☕',
      scenes: [
        {
          visual: 'Morning coffee at a third-wave Shibuya café.',
          text: '9am: coffee',
          voiceover: 'Start with coffee in Shibuya.',
        },
        {
          visual: 'Yoyogi Park — people picnicking, dogs playing.',
          text: '11am: Yoyogi Park',
          voiceover: 'Walk into Yoyogi by 11.',
        },
        {
          visual: 'Harajuku side street, crepe stand.',
          text: '1pm: Harajuku crepes',
          voiceover: 'Crepes in Harajuku for lunch.',
        },
        {
          visual: 'Late afternoon teamLab Planets entry.',
          text: '4pm: teamLab',
          voiceover: 'teamLab Planets in the late afternoon.',
        },
        {
          visual: 'Conveyor sushi at dusk, plates stacked.',
          text: '8pm: conveyor sushi',
          voiceover: 'Conveyor sushi for an early dinner.',
        },
      ],
      cta: 'Plan the perfect Tokyo Sunday on stayviaowner.com.',
      durationSec: 30,
      musicCue: 'mellow jazz, café ambience',
      hashtags: ['#tokyo', '#tokyovlog', '#travelreels', '#sundayintokyo', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Tokyo with kids — the realistic version 👨‍👩‍👧',
      scenes: [
        {
          visual: 'Family at teamLab Planets, kids in floating lanterns.',
          text: 'teamLab Planets — book ahead',
          voiceover: 'teamLab Planets — book two weeks ahead.',
        },
        {
          visual: 'Pokémon Café shot of kids excited at table.',
          text: 'Pokémon Café — 31 days out',
          voiceover: 'Pokémon Café opens reservations 31 days out at 6pm.',
        },
        {
          visual: 'Ueno Zoo entrance with panda statue.',
          text: 'Ueno Zoo for free play',
          voiceover: 'Ueno Zoo for unstructured kid energy.',
        },
        {
          visual: 'Family-friendly izakaya dinner scene.',
          text: 'Family-friendly izakayas',
          voiceover: 'Family-friendly izakayas exist — just go before 7.',
        },
      ],
      cta: 'Family Tokyo plan on stayviaowner.com.',
      durationSec: 24,
      musicCue: 'cheerful uplifting indie',
      hashtags: ['#tokyo', '#tokyowithkids', '#familytravel', '#travelreels', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Romantic Tokyo — 5 moves 💕',
      scenes: [
        {
          visual: 'Park Hyatt New York Bar at sunset.',
          text: 'Park Hyatt at sunset',
          voiceover: 'Park Hyatt at sunset, classic.',
        },
        {
          visual: 'Kimono rental walk in Yanaka.',
          text: 'Kimono walk in Yanaka',
          voiceover: 'Rent a kimono in Yanaka.',
        },
        {
          visual: 'Sushi counter, intimate two-top.',
          text: 'Private sushi counter',
          voiceover: 'Book a small omakase counter.',
        },
        {
          visual: 'Boat ride on the Sumida river at dusk.',
          text: 'Sumida boat at dusk',
          voiceover: 'Sumida river boat at dusk.',
        },
        {
          visual: 'Shibuya Sky observation, holding hands.',
          text: 'Shibuya Sky for the city',
          voiceover: 'End at Shibuya Sky.',
        },
      ],
      cta: 'Romantic Tokyo weekend on stayviaowner.com.',
      durationSec: 26,
      musicCue: 'soft piano, romantic',
      hashtags: ['#tokyo', '#romanticgetaway', '#couplestravel', '#travelreels', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Solo female in Tokyo: my honest experience 🎒',
      scenes: [
        {
          visual: 'Solo guest at a counter ramen spot, friendly chef.',
          text: 'Every counter has a seat for 1',
          voiceover: 'Counter dining is the secret weapon.',
        },
        {
          visual: 'Walking through Shimokitazawa, day pace.',
          text: 'Shimokitazawa = chill base',
          voiceover: 'Shimokita is the calmest base.',
        },
        {
          visual: 'Late-night walk through Shinjuku, busy but safe.',
          text: '2am walks feel safe',
          voiceover: 'I walked at 2am. I felt safer than in my own city.',
        },
      ],
      cta: 'Solo Tokyo plan on stayviaowner.com.',
      durationSec: 22,
      musicCue: 'mellow lo-fi with light synths',
      hashtags: ['#solofemaletravel', '#tokyosolo', '#solotravel', '#travelreels', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Tokyo packing list (don’t overdo it) 🎒',
      scenes: [
        {
          visual: 'Packing layout — neutral basics, walking shoes.',
          text: 'Walking shoes (real ones)',
          voiceover: 'Real walking shoes. You’ll walk 25k steps a day.',
        },
        {
          visual: 'Crossbody bag and translation app on phone.',
          text: 'Small day bag',
          voiceover: 'A small bag. Lockers are everywhere if you over-pack.',
        },
        {
          visual: 'IC card / Suica app on a phone, tapping at a turnstile.',
          text: 'Suica on your phone',
          voiceover: 'Add Suica to your phone before you fly.',
        },
      ],
      cta: 'Tokyo prep checklist on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'punchy lo-fi',
      hashtags: ['#tokyo', '#packingtips', '#travelpacking', '#travelreels', '#stayviaowner'],
    },
    {
      platform: 'instagram-reels',
      hook: 'Tokyo at golden hour — save this 🧡',
      scenes: [
        {
          visual: 'Shibuya Sky observation deck at sunset.',
          text: 'Shibuya Sky',
          voiceover: 'Shibuya Sky for the skyline.',
        },
        {
          visual: 'Tokyo Tower at dusk.',
          text: 'Tokyo Tower',
          voiceover: 'Tokyo Tower at dusk.',
        },
        {
          visual: 'Senso-ji at first light.',
          text: 'Senso-ji at dawn',
          voiceover: 'Senso-ji at first light.',
        },
        {
          visual: 'Roppongi Hills observation, last light.',
          text: 'Roppongi Hills',
          voiceover: 'Roppongi Hills at last light.',
        },
      ],
      cta: 'Save and plan on stayviaowner.com.',
      durationSec: 22,
      musicCue: 'cinematic ambient strings',
      hashtags: ['#tokyo', '#goldenhour', '#tokyoview', '#travelreels', '#travelinspo', '#stayviaowner'],
    },
  ],
  shorts: [
    {
      platform: 'youtube-shorts',
      hook: 'How to spend 3 days in Tokyo (rapid plan)',
      scenes: [
        {
          visual: 'Day-1 montage — Shibuya, ramen, capsule hotel.',
          text: 'Day 1: Shibuya + first ramen',
          voiceover: 'Day 1: Shibuya, scramble, first counter ramen, capsule hotel sleep.',
        },
        {
          visual: 'Day-2 montage — Asakusa morning, Tsukiji food, Ginza dinner.',
          text: 'Day 2: Asakusa → Tsukiji → Ginza',
          voiceover: 'Day 2: Asakusa morning, Tsukiji lunch, Ginza dinner.',
        },
        {
          visual: 'Day-3 montage — Yoyogi park, Shibuya Sky sunset.',
          text: 'Day 3: Yoyogi + Shibuya Sky sunset',
          voiceover: 'Day 3: Yoyogi park, Harajuku snacks, sunset from Shibuya Sky.',
        },
      ],
      cta: 'Get the full 3-day Tokyo plan free on stayviaowner.com.',
      durationSec: 28,
      musicCue: 'uplifting cinematic electronic',
      hashtags: ['#tokyo', '#tokyoitinerary', '#travelshorts', '#japanshorts', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Tokyo on $50/day — is it possible?',
      scenes: [
        {
          visual: 'Capsule hotel exterior, glowing sign.',
          text: 'Sleep: capsule = $30',
          voiceover: 'Capsule hotel: $30 a night.',
        },
        {
          visual: 'Counter ramen + 7-Eleven montage.',
          text: 'Eat: counter + konbini = $12',
          voiceover: 'Counter ramen plus konbini snacks: $12 a day.',
        },
        {
          visual: 'IC card tap at metro turnstile.',
          text: 'Transit: $6',
          voiceover: 'Metro: $6.',
        },
        {
          visual: 'Calculator overlay totalling $48.',
          text: 'Total: $48 — yes',
          voiceover: 'Total: $48. So yes, $50 in Tokyo works.',
        },
      ],
      cta: 'Budget Tokyo plan free on stayviaowner.com.',
      durationSec: 22,
      musicCue: 'jazzy upbeat lounge',
      hashtags: ['#tokyo', '#budgettravel', '#travelshorts', '#tokyobudget', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'The Tokyo neighborhoods explained in 30 seconds',
      scenes: [
        {
          visual: 'Shibuya scramble.',
          text: 'Shibuya = energy',
          voiceover: 'Shibuya is the energy.',
        },
        {
          visual: 'Asakusa Senso-ji.',
          text: 'Asakusa = old Tokyo',
          voiceover: 'Asakusa is old Tokyo.',
        },
        {
          visual: 'Shinjuku at night.',
          text: 'Shinjuku = trains + bars',
          voiceover: 'Shinjuku is for trains and bars.',
        },
        {
          visual: 'Shimokitazawa indie café.',
          text: 'Shimokitazawa = walkable indie',
          voiceover: 'Shimokita is walkable indie.',
        },
        {
          visual: 'Ginza luxury storefront.',
          text: 'Ginza = luxury',
          voiceover: 'Ginza is the luxury one.',
        },
      ],
      cta: 'Pick your Tokyo neighborhood on stayviaowner.com.',
      durationSec: 24,
      musicCue: 'punchy upbeat lo-fi',
      hashtags: ['#tokyo', '#tokyoneighborhoods', '#travelshorts', '#japan', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: '3 mistakes first-time Tokyo travelers make',
      scenes: [
        {
          visual: 'Person buying a JR Pass at a JR window.',
          text: 'Buying a JR Pass for Tokyo only',
          voiceover: 'Mistake 1: buying a JR Pass for a Tokyo-only trip. Use Suica.',
        },
        {
          visual: 'Eating ramen at 1pm in a crowded shop.',
          text: 'Eating at peak time',
          voiceover: 'Mistake 2: eating at 1pm. Queue is huge. Go at 11 or 2.',
        },
        {
          visual: 'Tourist lost staring at a metro map.',
          text: 'No offline metro app',
          voiceover: 'Mistake 3: not downloading Tokyo Metro app offline.',
        },
      ],
      cta: 'Tokyo prep checklist on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'tense rising electronic',
      hashtags: ['#tokyo', '#travelmistakes', '#travelshorts', '#tokyotips', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: '5 must-eat foods in Tokyo (with where)',
      scenes: [
        {
          visual: 'Ramen pour shot.',
          text: '1. Ramen — Ichiran',
          voiceover: 'Ramen at Ichiran. Tonkotsu, cubicle, fast.',
        },
        {
          visual: 'Sushi counter close-up.',
          text: '2. Omakase — Sushi Tama',
          voiceover: 'Omakase at Sushi Tama for accessible great sushi.',
        },
        {
          visual: 'Standing tempura.',
          text: '3. Tempura — Tendon Hannosuke',
          voiceover: 'Standing tempura at Tendon Hannosuke.',
        },
        {
          visual: 'Yakitori grill at Memory Lane.',
          text: '4. Yakitori — Memory Lane',
          voiceover: 'Yakitori under Memory Lane lanterns.',
        },
        {
          visual: 'Matcha parfait at Nakamura Tokichi.',
          text: '5. Matcha — Nakamura Tokichi',
          voiceover: 'End at Nakamura Tokichi for matcha.',
        },
      ],
      cta: 'Full Tokyo food map on stayviaowner.com.',
      durationSec: 26,
      musicCue: 'food-show jazzy lounge',
      hashtags: ['#tokyofood', '#tokyo', '#travelshorts', '#japanfood', '#foodtok', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Best time to visit Tokyo (with calendar)',
      scenes: [
        {
          visual: 'Calendar overlay highlighting March 25 – April 5.',
          text: 'Cherry blossoms: late March – early April',
          voiceover: 'Cherry blossom peak is late March through early April.',
        },
        {
          visual: 'Calendar overlay highlighting late Oct – mid Nov.',
          text: 'Fall foliage: late Oct – mid Nov',
          voiceover: 'Fall foliage peaks late October to mid-November.',
        },
        {
          visual: 'Calendar overlay marking January as off-season.',
          text: 'January = quietest',
          voiceover: 'January is quietest, cheapest, dry.',
        },
      ],
      cta: 'See the full seasonal guide on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'soft acoustic guitar',
      hashtags: ['#tokyo', '#besttimetovisit', '#travelshorts', '#travelplanning', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Day trips from Tokyo, ranked',
      scenes: [
        {
          visual: 'Mt. Fuji + Hakone train shot.',
          text: '1. Hakone',
          voiceover: 'Hakone for onsen + Fuji.',
        },
        {
          visual: 'Kamakura Buddha + beach.',
          text: '2. Kamakura',
          voiceover: 'Kamakura for the Buddha + beach.',
        },
        {
          visual: 'Nikko temples + waterfalls.',
          text: '3. Nikko',
          voiceover: 'Nikko for temples + waterfalls.',
        },
        {
          visual: 'Yokohama skyline + Chinatown.',
          text: '4. Yokohama',
          voiceover: 'Yokohama for Chinatown.',
        },
      ],
      cta: 'Book a Tokyo day trip on stayviaowner.com.',
      durationSec: 22,
      musicCue: 'uplifting cinematic',
      hashtags: ['#tokyo', '#daytrips', '#travelshorts', '#hakone', '#kamakura', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Tokyo with $0 — is it possible?',
      scenes: [
        {
          visual: 'Hachiko statue at Shibuya.',
          text: 'Hachiko — free',
          voiceover: 'Hachiko statue is free.',
        },
        {
          visual: 'Senso-ji temple front entrance.',
          text: 'Senso-ji temple — free',
          voiceover: 'Senso-ji temple is free.',
        },
        {
          visual: 'Meiji Shrine entrance pathway.',
          text: 'Meiji Shrine — free',
          voiceover: 'Meiji Shrine is free.',
        },
        {
          visual: 'Tokyo Metropolitan observation deck.',
          text: 'Metropolitan obs deck — free',
          voiceover: 'Tokyo Metropolitan Government Building observation deck — free.',
        },
      ],
      cta: 'Free Tokyo plan on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'punchy uplifting electronic',
      hashtags: ['#tokyo', '#freetokyo', '#budgettravel', '#travelshorts', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Where Tokyo locals actually eat',
      scenes: [
        {
          visual: 'Shimokitazawa ramen joint, locals at counter.',
          text: 'Shimokita ramen joints',
          voiceover: 'Shimokita has the best non-tourist ramen.',
        },
        {
          visual: 'Yanaka standing soba.',
          text: 'Yanaka standing soba',
          voiceover: 'Yanaka standing soba is real Tokyo.',
        },
        {
          visual: 'Office worker at a kissaten coffee shop.',
          text: 'Kissaten coffee',
          voiceover: 'Old-school kissaten coffee shops for the morning.',
        },
      ],
      cta: 'Local Tokyo food guide on stayviaowner.com.',
      durationSec: 18,
      musicCue: 'mellow lo-fi',
      hashtags: ['#tokyofood', '#localtokyo', '#travelshorts', '#tokyo', '#stayviaowner'],
    },
    {
      platform: 'youtube-shorts',
      hook: 'Tokyo apps to download before you fly',
      scenes: [
        {
          visual: 'Phone showing Google Maps with Tokyo metro.',
          text: 'Google Maps offline',
          voiceover: 'Google Maps offline — download Tokyo.',
        },
        {
          visual: 'Phone showing Suica in Apple Wallet.',
          text: 'Suica in Apple Wallet',
          voiceover: 'Add Suica to your wallet before you go.',
        },
        {
          visual: 'Phone showing Japan Travel by Navitime app.',
          text: 'Navitime for trains',
          voiceover: 'Navitime for train transfers — better than Maps.',
        },
        {
          visual: 'Phone showing TableLog reviews.',
          text: 'TableLog for restaurants',
          voiceover: 'TableLog for the restaurant rating that locals trust.',
        },
      ],
      cta: 'Pre-flight Tokyo checklist on stayviaowner.com.',
      durationSec: 20,
      musicCue: 'punchy productivity beat',
      hashtags: ['#tokyo', '#travelapps', '#travelshorts', '#travelprep', '#stayviaowner'],
    },
  ],
};

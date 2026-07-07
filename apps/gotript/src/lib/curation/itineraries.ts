import type { Itinerary, ItineraryDay, ItinerarySlot } from '@core/itinerary';

/**
 * Curated 3-day itineraries per Italian destination. Hand-authored;
 * voice rule applies (italic Fraunces, no banned words from
 * `lib/curation/voice.ts`). The itinerary-curation test enforces
 * the lint across every slot.
 *
 * The shape is editorial, not transactional - these are the kind of
 * notes a friend who's lived in the region would write down for you.
 * C3.x layers Viator activity search on top to attach bookables to
 * specific slots.
 *
 * Each entry is a *template* - the generator stamps `tripId` +
 * `generatedAt` at runtime so two callers reusing the same curated
 * lookup don't share identity.
 */

export type CuratedItineraryTemplate = Omit<Itinerary, 'tripId' | 'generatedAt'>;

// Helper to keep the table readable.
const slot = (
  id: string,
  kind: ItinerarySlot['kind'],
  startHint: ItinerarySlot['startHint'],
  title: string,
  detail: string,
  extras: Partial<ItinerarySlot> = {},
): ItinerarySlot => ({
  id,
  kind,
  startHint,
  title,
  detail,
  ...extras,
});

const day = (dayNumber: number, theme: string, slots: ItinerarySlot[]): ItineraryDay => ({
  dayNumber,
  theme,
  slots,
});

// ============== Tuscany ==============
const TUSCANY: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three slow days in Tuscany. Hill towns, vineyard light, long lunches under olive trees.',
  days: [
    day(1, 'Florence, then olive country.', [
      slot(
        't1-m',
        'meal',
        'morning',
        'Coffee at Ditta Artigianale',
        'A neighborhood roaster on the Oltrarno side. Stand at the bar with a cornetto and watch Florence wake up.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        't1-a1',
        'activity',
        'morning',
        'The Boboli Gardens, slowly',
        'Skip the Uffizi today. The cypress allées behind Pitti Palace give you Florence in the right scale.',
        { durationMinutes: 120, costTier: 'low', tags: ['walk', 'gardens'] },
      ),
      slot(
        't1-l',
        'meal',
        'midday',
        'Lunch at Trattoria Cammillo',
        'A 70-year-old room, soft lighting, the kind of bistecca that makes you understand why people stay forever.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
      slot(
        't1-tx',
        'transit',
        'afternoon',
        'Drive south into Chianti',
        'Greve in Chianti is an hour. The long way through Strada in Chianti adds stone walls and vineyards.',
        { durationMinutes: 90, tags: ['drive'] },
      ),
      slot(
        't1-d',
        'meal',
        'evening',
        'Dinner at the agriturismo table',
        'Most Tuscan farm stays cook one menu, served late. Sit outside if the night allows.',
        { costTier: 'mid', tags: ['agriturismo'] },
      ),
    ]),
    day(2, 'Wine country, all day.', [
      slot(
        't2-m',
        'meal',
        'morning',
        'Slow breakfast on the terrace',
        'Whatever the kitchen put out - bread, jam, ricotta. Do not rush.',
        { costTier: 'low' },
      ),
      slot(
        't2-a1',
        'activity',
        'morning',
        'Castello di Ama tasting',
        'A working winery + an art project. Book the morning slot before they fill. The cellar is cool even in August.',
        { durationMinutes: 120, costTier: 'mid', tags: ['wine', 'art'] },
      ),
      slot(
        't2-l',
        'meal',
        'midday',
        'Lunch at La Bottega di Volpaia',
        'In the medieval stone village. Order whatever the kitchen made too much of.',
        { costTier: 'mid', tags: ['village'] },
      ),
      slot(
        't2-a2',
        'activity',
        'afternoon',
        'Drive to San Donato in Poggio',
        'A Romanesque hill town with one of the best sunsets in Chianti. Park outside the gate; walk in.',
        { durationMinutes: 90, tags: ['hill-town', 'sunset'] },
      ),
      slot(
        't2-d',
        'meal',
        'evening',
        'Dinner at Antica Trattoria La Toppa',
        'Set inside the old tower. Order the pici al cinghiale.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
    ]),
    day(3, 'Siena and the way home.', [
      slot(
        't3-tx',
        'transit',
        'morning',
        'Drive to Siena (45 min)',
        'Park at Stadio and walk in. The first view of the Campo is worth the parking ticket.',
        { durationMinutes: 60, tags: ['drive'] },
      ),
      slot(
        't3-a1',
        'activity',
        'morning',
        'Piazza del Campo, then the Duomo',
        'Cathedral first while it is empty; sit on the Campo with a coffee after.',
        { durationMinutes: 150, costTier: 'low', tags: ['walk', 'cathedral'] },
      ),
      slot(
        't3-l',
        'meal',
        'midday',
        'Lunch at Osteria Le Logge',
        'A few steps from the Campo. Dario Cecchini-supplied steak; quiet courtyard.',
        { costTier: 'mid', tags: ['osteria'] },
      ),
      slot(
        't3-a2',
        'activity',
        'afternoon',
        'San Gimignano on the way back',
        'Tower town. Climb one. Eat a Dondoli gelato. Continue home before dusk.',
        { durationMinutes: 120, costTier: 'low', tags: ['hill-town', 'walk'] },
      ),
      slot(
        't3-d',
        'meal',
        'evening',
        'Last dinner at the farm',
        'Whatever the kitchen has. Open the second bottle.',
        { costTier: 'mid', tags: ['agriturismo'] },
      ),
    ]),
  ],
};

// ============== Umbria ==============
const UMBRIA: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three quiet days through hill towns and olive groves. Slower than Tuscany, less polished, often more honest.',
  days: [
    day(1, 'Assisi and the high road.', [
      slot(
        'u1-m',
        'meal',
        'morning',
        'Coffee in Assisi',
        'Bar Sensi on Piazza del Comune. Sit outside, eat a torta al testo.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'u1-a1',
        'activity',
        'morning',
        'Basilica di San Francesco',
        'Two superimposed churches. The Giotto frescoes in the upper basilica are the reason most people come; the crypt is where it gets quiet.',
        { durationMinutes: 120, costTier: 'free', tags: ['art', 'church'] },
      ),
      slot(
        'u1-l',
        'meal',
        'midday',
        'Lunch at La Stalla',
        'Outside Assisi on a back road. Open hearth. The gnocchi al sugo de oca is rare and worth the drive.',
        { costTier: 'mid', tags: ['rural'] },
      ),
      slot(
        'u1-a2',
        'activity',
        'afternoon',
        'Drive the SS75 ridge to Spello',
        'Pink-stone village pinned to a hillside. Walk top to bottom; emerge among olive groves.',
        { durationMinutes: 120, tags: ['hill-town', 'drive'] },
      ),
      slot(
        'u1-d',
        'meal',
        'evening',
        'Dinner at La Bastiglia',
        'Spello restaurant with a tasting menu rooted in foraged herbs and local pork.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
    ]),
    day(2, 'Orvieto and underground.', [
      slot(
        'u2-tx',
        'transit',
        'morning',
        'Drive to Orvieto (1h)',
        'The town sits on a tufa plateau. Park at Campo della Fiera + take the funicular.',
        { durationMinutes: 80, tags: ['drive'] },
      ),
      slot(
        'u2-a1',
        'activity',
        'morning',
        'The Duomo facade',
        'Striped marble + Signorelli frescoes inside. The facade alone deserves an hour.',
        { durationMinutes: 90, costTier: 'low', tags: ['cathedral', 'art'] },
      ),
      slot(
        'u2-l',
        'meal',
        'midday',
        'Lunch at I Sette Consoli',
        'Sit in the garden. The wine list is deep into Umbrian whites.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
      slot(
        'u2-a2',
        'activity',
        'afternoon',
        'Orvieto Underground tour',
        '2,500 years of caves below the city. Cool even in summer; about 90 minutes.',
        { durationMinutes: 90, costTier: 'low', tags: ['tour', 'history'] },
      ),
      slot(
        'u2-d',
        'meal',
        'evening',
        'Aperitivo at Le Grotte del Funaro',
        'Carved into the tufa cliff. Order an Orvieto Classico with bruschetta.',
        { costTier: 'low', tags: ['aperitivo'] },
      ),
    ]),
    day(3, 'Lake Trasimeno and home.', [
      slot(
        'u3-m',
        'meal',
        'morning',
        'Breakfast on the terrace',
        'Eggs from the farm, espresso, the view of Mount Subasio.',
        { costTier: 'low' },
      ),
      slot(
        'u3-a1',
        'activity',
        'morning',
        'Drive to Castiglione del Lago',
        'A castle town on Lake Trasimeno. Walk the ramparts; the lake stretches away.',
        { durationMinutes: 120, costTier: 'low', tags: ['lake', 'castle'] },
      ),
      slot(
        'u3-l',
        'meal',
        'midday',
        'Lunch on Isola Maggiore',
        'A 30-min ferry. Eat lake fish at La Romantica with the door open.',
        { costTier: 'mid', tags: ['island', 'fish'] },
      ),
      slot(
        'u3-a2',
        'activity',
        'afternoon',
        'Slow drive home through Citta della Pieve',
        'Perugino frescoes in a small square. Then back roads through wheat and sunflowers.',
        { durationMinutes: 120, tags: ['drive', 'art'] },
      ),
      slot(
        'u3-d',
        'meal',
        'evening',
        'Dinner near the agriturismo',
        'Whatever is closest and serves wood-fired pizza. Last night should be easy.',
        { costTier: 'low' },
      ),
    ]),
  ],
};

// ============== Amalfi Coast ==============
const AMALFI: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three days of cliffs and lemons. The coast road is the point; the view from your dinner table is the reward.',
  days: [
    day(1, 'Positano on foot.', [
      slot(
        'a1-m',
        'meal',
        'morning',
        'Sfogliatella at La Zagara',
        'Garden cafe with citrus trees. Order one ricotta + one custard.',
        { costTier: 'low', tags: ['cafe', 'pastry'] },
      ),
      slot(
        'a1-a1',
        'activity',
        'morning',
        'Walk down to Marina Grande',
        'The town only flows downhill. The Path of the Gods can wait - today is for the village itself.',
        { durationMinutes: 120, costTier: 'free', tags: ['walk'] },
      ),
      slot(
        'a1-l',
        'meal',
        'midday',
        'Lunch at Da Adolfo',
        'A boat shuttles you to the beach restaurant. Grilled mozzarella on lemon leaves; sancerre cold from the ice.',
        { costTier: 'high', tags: ['beach', 'seafood'] },
      ),
      slot(
        'a1-r',
        'rest',
        'afternoon',
        'Hotel pool / sea swim',
        'The afternoon sun is unkind on the coast road. Lie down.',
        { durationMinutes: 180, tags: ['beach', 'pool'] },
      ),
      slot(
        'a1-d',
        'meal',
        'evening',
        'Dinner at La Tagliata',
        'High above town. They serve what they cooked; an open hearth and the lights of Positano below.',
        { costTier: 'mid', tags: ['family-style'] },
      ),
    ]),
    day(2, 'Capri by ferry.', [
      slot(
        'a2-tx',
        'transit',
        'morning',
        'Ferry from Positano to Capri',
        'Twenty-five minutes by hydrofoil. The crowds appear on the marina; walk past them up to Capri town.',
        { durationMinutes: 30, costTier: 'low', tags: ['ferry'] },
      ),
      slot(
        'a2-a1',
        'activity',
        'morning',
        'The Faraglioni walk via Via Tragara',
        'The most photographed view on the island; the walk that earns it is what makes it stick.',
        { durationMinutes: 90, costTier: 'free', tags: ['walk', 'cliff'] },
      ),
      slot(
        'a2-l',
        'meal',
        'midday',
        'Lunch at Da Paolino',
        'Lemon-grove courtyard. Lights strung in the trees. Anyone who tells you Capri is overrated has not eaten here.',
        { costTier: 'high', tags: ['restaurant'] },
      ),
      slot(
        'a2-a2',
        'activity',
        'afternoon',
        'Anacapri + Monte Solaro chair lift',
        'Highest point on the island. Fifteen minutes up, fifteen down, an hour at the top doing nothing.',
        { durationMinutes: 150, costTier: 'low', tags: ['chairlift', 'view'] },
      ),
      slot(
        'a2-tx2',
        'transit',
        'evening',
        'Last ferry back to Positano',
        'Catch the sunset crossing if you can.',
        { durationMinutes: 30, tags: ['ferry'] },
      ),
    ]),
    day(3, 'Ravello above it all.', [
      slot(
        'a3-tx',
        'transit',
        'morning',
        'Drive to Ravello (45 min)',
        'Switchbacks past Amalfi town. Park at the lower lot; walk up to the piazza.',
        { durationMinutes: 60, tags: ['drive'] },
      ),
      slot(
        'a3-a1',
        'activity',
        'morning',
        'Villa Cimbrone gardens',
        'The Terrace of Infinity is the only thing that lives up to its name on the coast.',
        { durationMinutes: 120, costTier: 'low', tags: ['gardens', 'view'] },
      ),
      slot(
        'a3-l',
        'meal',
        'midday',
        'Lunch at Babel',
        'A small wine bar with cured meats and the local Costa d’Amalfi. Quiet.',
        { costTier: 'mid', tags: ['wine-bar'] },
      ),
      slot(
        'a3-a2',
        'activity',
        'afternoon',
        'Walk down to Atrani',
        'A 90-minute path through lemon terraces ending at a tiny piazza on the sea.',
        { durationMinutes: 100, costTier: 'free', tags: ['walk'] },
      ),
      slot(
        'a3-d',
        'meal',
        'evening',
        'Last dinner at Il Tridente',
        'Positano hotel rooftop. The price of your dinner is the price of the view.',
        { costTier: 'high', tags: ['rooftop'] },
      ),
    ]),
  ],
};

// ============== Rome ==============
const ROME: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three days, ancient to neighborhood. Walk everywhere; espresso whenever the light shifts.',
  days: [
    day(1, 'The ancient city.', [
      slot(
        'r1-m',
        'meal',
        'morning',
        'Coffee at Sant’Eustachio',
        'No sugar, no fuss. Stand at the marble bar.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'r1-a1',
        'activity',
        'morning',
        'Pantheon and Piazza Navona',
        'Pantheon first, then Caravaggio in San Luigi dei Francesi a few blocks east.',
        { durationMinutes: 120, costTier: 'free', tags: ['art', 'walk'] },
      ),
      slot(
        'r1-l',
        'meal',
        'midday',
        'Lunch at Armando al Pantheon',
        'Roman classics, two-room, reservation needed. Cacio e pepe is the test.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
      slot(
        'r1-a2',
        'activity',
        'afternoon',
        'Colosseum + Roman Forum',
        'Buy the timed entry online. The Forum side is bigger than you think; allow two hours.',
        { durationMinutes: 180, costTier: 'mid', tags: ['ruins', 'walk'] },
      ),
      slot(
        'r1-d',
        'meal',
        'evening',
        'Dinner in Monti',
        'La Carbonara on Piazza della Madonna dei Monti. Sit outside; the neighborhood drinks on the steps.',
        { costTier: 'mid', tags: ['neighborhood'] },
      ),
    ]),
    day(2, 'Trastevere day.', [
      slot(
        'r2-m',
        'meal',
        'morning',
        'Cornetti at I Dolci di Nonna Vincenza',
        'Sicilian pastries in central Rome. The pistachio cornetto is the order.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'r2-a1',
        'activity',
        'morning',
        'Cross to Trastevere via Tiber Island',
        'The slow way. Stop at Ponte Sisto; look back at the dome of St Peter.',
        { durationMinutes: 90, costTier: 'free', tags: ['walk'] },
      ),
      slot(
        'r2-l',
        'meal',
        'midday',
        'Lunch at Da Enzo al 29',
        'Two rooms, Roman-Jewish. Carciofi alla giudia in season. No reservations after 7.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
      slot(
        'r2-a2',
        'activity',
        'afternoon',
        'Villa Doria Pamphili park',
        'Romans escape here on weekends. Shaded paths; a quiet break from cobblestones.',
        { durationMinutes: 120, costTier: 'free', tags: ['walk', 'park'] },
      ),
      slot(
        'r2-d',
        'meal',
        'evening',
        'Aperitivo at Freni e Frizioni',
        'Old mechanic’s shop turned bar. Get a Negroni; the snacks are real food.',
        { costTier: 'low', tags: ['aperitivo'] },
      ),
    ]),
    day(3, 'Vatican + slow afternoon.', [
      slot(
        'r3-a1',
        'activity',
        'morning',
        'Vatican Museums + Sistine Chapel',
        'First entry slot, 8am. The 90 minutes after opening are the only quiet you’ll get.',
        { durationMinutes: 180, costTier: 'mid', tags: ['art'] },
      ),
      slot(
        'r3-l',
        'meal',
        'midday',
        'Lunch at Bonci Pizzarium',
        'Pizza al taglio, weighed by the slice. Stand at the counter; eat fast.',
        { costTier: 'low', tags: ['pizza'] },
      ),
      slot(
        'r3-r',
        'rest',
        'afternoon',
        'Coffee at Castroni Cola di Rienzo',
        'Old-school import shop with bar. Sit, write postcards, watch the neighborhood.',
        { durationMinutes: 60, costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'r3-a2',
        'activity',
        'evening',
        'Sunset at Pincio Terrace',
        'Above Piazza del Popolo. Don’t time it tightly; the light is best on the dome at 7pm.',
        { durationMinutes: 60, costTier: 'free', tags: ['view'] },
      ),
      slot(
        'r3-d',
        'meal',
        'evening',
        'Last dinner at Roscioli',
        'Salumeria + restaurant. Their carbonara has a cult; book the small back room weeks ahead.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
    ]),
  ],
};

// ============== Venice ==============
const VENICE: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three days where wrong turns are the right ones. Walk early, walk late, eat where the locals stand.',
  days: [
    day(1, 'San Marco at dawn.', [
      slot(
        'v1-m',
        'meal',
        'morning',
        'Coffee at Caffè Florian',
        'Yes it is touristy. Yes it is also where Casanova drank coffee. Take the early window before the orchestra starts.',
        { costTier: 'mid', tags: ['cafe'] },
      ),
      slot(
        'v1-a1',
        'activity',
        'morning',
        'St Mark’s Basilica + Campanile',
        'Reserve the basilica entry. Climb the Campanile for the bird’s view of the lagoon.',
        { durationMinutes: 150, costTier: 'low', tags: ['cathedral', 'view'] },
      ),
      slot(
        'v1-l',
        'meal',
        'midday',
        'Cicchetti crawl in Cannaregio',
        'Al Timon, then Ca’ d’Oro alla Vedova. Stand at the canal-side bars; small plates, small wine pours.',
        { costTier: 'low', tags: ['cicchetti', 'walk'] },
      ),
      slot(
        'v1-a2',
        'activity',
        'afternoon',
        'Walk Cannaregio to the Ghetto',
        'Quietest sestiere in the city. Old synagogues, fewer footbridges, lower buildings.',
        { durationMinutes: 120, costTier: 'free', tags: ['walk', 'history'] },
      ),
      slot(
        'v1-d',
        'meal',
        'evening',
        'Dinner at Antiche Carampane',
        'Off the main route in San Polo. Reservations weeks ahead; lagoon fish.',
        { costTier: 'high', tags: ['restaurant'] },
      ),
    ]),
    day(2, 'Dorsoduro and the Accademia.', [
      slot(
        'v2-m',
        'meal',
        'morning',
        'Pastry at Tonolo',
        'Lines but they move fast. The bigne with chantilly is the order.',
        { costTier: 'low', tags: ['pastry'] },
      ),
      slot(
        'v2-a1',
        'activity',
        'morning',
        'Gallerie dell’Accademia',
        'Small enough to do in 90 minutes. Start with the Bellinis; finish with Veronese’s Feast.',
        { durationMinutes: 120, costTier: 'low', tags: ['art'] },
      ),
      slot(
        'v2-l',
        'meal',
        'midday',
        'Lunch at Estro',
        'Wine bar + osteria run by two brothers. Natural wines, small daily menu.',
        { costTier: 'mid', tags: ['wine-bar'] },
      ),
      slot(
        'v2-a2',
        'activity',
        'afternoon',
        'Punta della Dogana',
        'Pinault Foundation contemporary art space at the tip of Dorsoduro. The building alone is worth it.',
        { durationMinutes: 120, costTier: 'low', tags: ['art', 'view'] },
      ),
      slot(
        'v2-d',
        'meal',
        'evening',
        'Dinner at Osteria alle Testiere',
        'Twenty-two seats. Lagoon-fish menu changes daily. Reserve at booking.',
        { costTier: 'high', tags: ['osteria'] },
      ),
    ]),
    day(3, 'Burano and Torcello.', [
      slot(
        'v3-tx',
        'transit',
        'morning',
        'Vaporetto to Burano (45 min)',
        'Line 12 from Fondamente Nove. The colored houses are the cliche; everything else is what makes it worth the trip.',
        { durationMinutes: 60, costTier: 'low', tags: ['ferry'] },
      ),
      slot(
        'v3-a1',
        'activity',
        'morning',
        'Walk Burano + Mazzorbo',
        'The bridge over to Mazzorbo (vineyard island) is where the crowds end. Walk it; it is twenty minutes of nothing.',
        { durationMinutes: 90, costTier: 'free', tags: ['walk'] },
      ),
      slot(
        'v3-l',
        'meal',
        'midday',
        'Lunch at Venissa',
        'Michelin star on Mazzorbo. A walled garden, dorona-grape vineyard. Set menu only; book ahead.',
        { costTier: 'high', tags: ['restaurant'] },
      ),
      slot(
        'v3-a2',
        'activity',
        'afternoon',
        'Torcello cathedral',
        'The oldest church in the lagoon. Byzantine mosaics; you’ll be one of perhaps twenty visitors.',
        { durationMinutes: 90, costTier: 'low', tags: ['cathedral', 'history'] },
      ),
      slot(
        'v3-d',
        'meal',
        'evening',
        'Last spritz back at Campo Santa Margherita',
        'The student square. Sit on the pavement; the city quiets down by ten.',
        { costTier: 'low', tags: ['aperitivo'] },
      ),
    ]),
  ],
};

// ============== Lake Como ==============
const LAKE_COMO: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three days on the water. Boats are the metro; mornings on shaded balconies; long lunches on stone terraces.',
  days: [
    day(1, 'Bellagio settling-in.', [
      slot(
        'l1-m',
        'meal',
        'morning',
        'Coffee at Bar Salita Mella',
        'On the steep stair-street up from the ferry. The old men’s morning bar; sit outside.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'l1-a1',
        'activity',
        'morning',
        'Walk up to Punta Spartivento',
        'The point where the lake splits in three. Twenty minutes up; benches at the top.',
        { durationMinutes: 60, costTier: 'free', tags: ['walk', 'view'] },
      ),
      slot(
        'l1-l',
        'meal',
        'midday',
        'Lunch at Trattoria San Giacomo',
        'Set into the cobblestone alley. Order the missoltini if you want to eat what the lake actually grows.',
        { costTier: 'mid', tags: ['trattoria', 'lake-fish'] },
      ),
      slot(
        'l1-r',
        'rest',
        'afternoon',
        'Lakefront, your own pace',
        'Find a bench. Read a book. The whole point of Lake Como is to do this.',
        { durationMinutes: 120, costTier: 'free' },
      ),
      slot(
        'l1-d',
        'meal',
        'evening',
        'Dinner at Salice Blu',
        'Family-run, quiet, off the ferry square. Set menu most nights; ask what the kitchen has.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
    ]),
    day(2, 'Villa day on the west shore.', [
      slot(
        'l2-tx',
        'transit',
        'morning',
        'Ferry to Villa del Balbianello',
        'Twenty minutes on the water. The villa has its own dock; you arrive by boat as the original owners did.',
        { durationMinutes: 30, costTier: 'low', tags: ['ferry'] },
      ),
      slot(
        'l2-a1',
        'activity',
        'morning',
        'Villa del Balbianello gardens',
        'Star Wars filmed here, but the villa’s real story is the explorer Guido Monzino. The library is one room over.',
        { durationMinutes: 120, costTier: 'low', tags: ['villa', 'gardens'] },
      ),
      slot(
        'l2-l',
        'meal',
        'midday',
        'Lunch at Trattoria del Mil',
        'Lenno village, near the ferry. Garden seating; pasta with local trout.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
      slot(
        'l2-a2',
        'activity',
        'afternoon',
        'Villa Carlotta in Tremezzo',
        'Famous for the rhododendrons in May; the lake terrace is good any season.',
        { durationMinutes: 120, costTier: 'low', tags: ['villa', 'gardens'] },
      ),
      slot(
        'l2-d',
        'meal',
        'evening',
        'Aperitivo on the Tremezzo lakefront',
        'Sit at any of the cafes; the sunset light hits the eastern shore at seven.',
        { costTier: 'low', tags: ['aperitivo', 'sunset'] },
      ),
    ]),
    day(3, 'Northern lake, slow morning.', [
      slot(
        'l3-m',
        'meal',
        'morning',
        'Slow breakfast in your room',
        'Lake mornings are misty. Take it on the balcony.',
        { costTier: 'low' },
      ),
      slot(
        'l3-a1',
        'activity',
        'morning',
        'Drive or ferry to Varenna',
        'The east-shore village most people skip. Walk the lakefront promenade; the colors here are sharper than Bellagio.',
        { durationMinutes: 120, costTier: 'low', tags: ['village', 'walk'] },
      ),
      slot(
        'l3-l',
        'meal',
        'midday',
        'Lunch at Vecchia Varenna',
        'On the water; small terrace. Lake-fish carpaccio if it is on the menu.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
      slot(
        'l3-a2',
        'activity',
        'afternoon',
        'Castello di Vezio + falconry',
        'A 30-minute walk above Varenna. Castle ruins; falcons released a few times a day.',
        { durationMinutes: 120, costTier: 'low', tags: ['castle', 'walk'] },
      ),
      slot(
        'l3-d',
        'meal',
        'evening',
        'Dinner back in Bellagio',
        'Whatever room your hotel reserved. Order off-menu if they offer.',
        { costTier: 'mid', tags: ['hotel'] },
      ),
    ]),
  ],
};

// ============== Cinque Terre ==============
const CINQUE_TERRE: CuratedItineraryTemplate = {
  source: 'curated',
  summary:
    'Three days walking between five villages. Trains when the legs need rest; pesto for lunch; an Aperol on a stone wall.',
  days: [
    day(1, 'Monterosso to Vernazza.', [
      slot(
        'c1-m',
        'meal',
        'morning',
        'Cappuccino on the Monterosso beach',
        'Bar Stalin (yes really). Sit on the stone wall.',
        { costTier: 'low', tags: ['cafe'] },
      ),
      slot(
        'c1-a1',
        'activity',
        'morning',
        'Sentiero Azzurro to Vernazza',
        'The classic walk. Two hours of stone path between the vineyards and the sea. Hat + water. Train back if you want.',
        { durationMinutes: 150, costTier: 'low', tags: ['walk', 'hike'] },
      ),
      slot(
        'c1-l',
        'meal',
        'midday',
        'Lunch at Trattoria Gianni Franzi',
        'In Vernazza’s harbor square. Anchovies + spaghetti al pesto.',
        { costTier: 'mid', tags: ['trattoria'] },
      ),
      slot(
        'c1-r',
        'rest',
        'afternoon',
        'Swim from Vernazza’s small beach',
        'Tucked inside the harbor. Bring a towel; the bars don’t loan them.',
        { durationMinutes: 90, costTier: 'free', tags: ['swim'] },
      ),
      slot(
        'c1-d',
        'meal',
        'evening',
        'Dinner at Belforte',
        'Restaurant carved into the medieval tower in Vernazza. Reserve the terrace for sunset.',
        { costTier: 'high', tags: ['restaurant', 'view'] },
      ),
    ]),
    day(2, 'Manarola + Riomaggiore.', [
      slot(
        'c2-tx',
        'transit',
        'morning',
        'Train to Manarola',
        'Five minutes between villages. The train is your friend on warm days.',
        { durationMinutes: 15, costTier: 'low', tags: ['train'] },
      ),
      slot(
        'c2-a1',
        'activity',
        'morning',
        'Walk up to the Punta Bonfiglio',
        'The viewpoint above Manarola is the postcard. Twenty minutes of stairs from the harbor.',
        { durationMinutes: 60, costTier: 'free', tags: ['walk', 'view'] },
      ),
      slot(
        'c2-l',
        'meal',
        'midday',
        'Lunch at Nessun Dorma',
        'Cheese-and-pesto board, an Aperol, the view of the village pinned to the cliffs. No reservations; line is part of it.',
        { costTier: 'mid', tags: ['view'] },
      ),
      slot(
        'c2-a2',
        'activity',
        'afternoon',
        'Train to Riomaggiore',
        'Smallest of the five. Walk the harbor stones; sit on the seawall.',
        { durationMinutes: 90, costTier: 'low', tags: ['village'] },
      ),
      slot(
        'c2-d',
        'meal',
        'evening',
        'Dinner at A Piè de Mà',
        'Up the cliff in Riomaggiore. Linen tablecloths; fish caught that morning.',
        { costTier: 'high', tags: ['restaurant'] },
      ),
    ]),
    day(3, 'A slower day in Corniglia.', [
      slot(
        'c3-tx',
        'transit',
        'morning',
        'Train to Corniglia',
        'The middle village. Set on a hilltop, no harbor; everyone skips it. That’s the gift.',
        { durationMinutes: 15, costTier: 'low', tags: ['train'] },
      ),
      slot(
        'c3-a1',
        'activity',
        'morning',
        'The Lardarina stairs up + village walk',
        'Three hundred and seventy steps from the train station. Espresso at the top is well-earned.',
        { durationMinutes: 90, costTier: 'free', tags: ['walk', 'climb'] },
      ),
      slot(
        'c3-l',
        'meal',
        'midday',
        'Lunch at Cecio',
        'A small terrace looking south to the sea. The seafood antipasto is the whole reason to come.',
        { costTier: 'mid', tags: ['restaurant'] },
      ),
      slot(
        'c3-a2',
        'activity',
        'afternoon',
        'Sunset on the Belvedere di Santa Maria',
        'A bench with a view of all five villages south to north. Bring a small bottle of wine.',
        { durationMinutes: 90, costTier: 'free', tags: ['view', 'sunset'] },
      ),
      slot(
        'c3-d',
        'meal',
        'evening',
        'Last dinner back in Monterosso',
        'Miky on the beach if it’s open. Order the lobster spaghetti.',
        { costTier: 'high', tags: ['restaurant'] },
      ),
    ]),
  ],
};

// ============== Registry ==============

export const CURATED_ITINERARIES: Readonly<Record<string, CuratedItineraryTemplate>> = {
  tuscany: TUSCANY,
  umbria: UMBRIA,
  amalfi: AMALFI,
  rome: ROME,
  venice: VENICE,
  'lake-como': LAKE_COMO,
  'cinque-terre': CINQUE_TERRE,
};

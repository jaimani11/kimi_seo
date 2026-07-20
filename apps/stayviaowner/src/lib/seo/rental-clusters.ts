/**
 * stayviaowner CURATED niche clusters — hand-picked, genuinely-distinct
 * US vacation-rental landing pages that sit ALONGSIDE (not inside) the
 * per-city × property-type matrix in `rental-routes.ts`.
 *
 * Why a separate curated layer and not new ACCOMMODATION_CATEGORIES:
 *   - Adding a category multiplies it across all 216 SEO_CITIES, spawning
 *     thousands of thin pages. These clusters are the opposite bet: ~15
 *     hand-written US destinations each, with real local specifics, to
 *     TEST demand before anything scales. See the 60-90 day scorecard.
 *   - Their destinations are US vacation TOWNS (Gatlinburg, Broken Bow,
 *     Corolla…) that are deliberately NOT in the world-city matrix, so
 *     these pages do not cannibalise the existing /cabins, /farmhouses or
 *     /mansions category pages (which target Banff, Zermatt, Mallorca…).
 *
 * URL scheme (mounted under /rentals/[slug], parsed BEFORE the matrix):
 *   /rentals/{stem}                 → cluster hub   (e.g. /rentals/cabins-with-hot-tubs)
 *   /rentals/{stem}-in-{townSlug}   → town page     (e.g. /rentals/cabins-with-hot-tubs-in-gatlinburg)
 *
 * Monetization: VRBO ONLY (whole-home, category 'vacation-rentals' via
 * stayviaowner's Partnerize camref). No Booking.com, no Expedia hotels,
 * no Viator — these pages are deliberately leakage-free.
 */

export interface ClusterFaq {
  q: string;
  a: string;
}

export interface ClusterTown {
  /** Slug fragment after "{stem}-in-". */
  townSlug: string;
  /** Display name (may be a region, e.g. "Finger Lakes"). */
  town: string;
  /** US state abbreviation. */
  state: string;
  /** Free-text location string handed to VRBO search (destination-preserving). */
  vrboDestination: string;
  /** <=160 char meta description, unique per town. */
  metaDescription: string;
  /** 120-170 word, genuinely town-specific lead. */
  intro: string;
  /** Where to look — real sub-areas/roads. */
  bestAreas: string;
  /** This town's seasonality. */
  whenToBook: string;
  /** Realistic nightly price band. */
  priceBand: string;
  /** 3 town-specific, PAA-style FAQs. */
  faqs: ClusterFaq[];
}

export interface RentalCluster {
  /** URL stem, e.g. 'cabins-with-hot-tubs'. */
  slug: string;
  /** Display name, e.g. 'Cabins with hot tubs'. */
  name: string;
  emoji: string;
  /** Own sitemap section name (per-cluster discovery reporting in GSC). */
  sitemapSection: string;
  /** Existing accommodation category this cluster relates to (internal links). */
  relatedCategorySlug: string;
  relatedCategoryLabel: string;
  hub: { h1: string; metaDescription: string; intro: string };
  towns: readonly ClusterTown[];
}

export const RENTAL_CLUSTERS: readonly RentalCluster[] = [
  {
    slug: 'cabins-with-hot-tubs',
    name: 'Cabins with hot tubs',
    emoji: '🛁',
    sitemapSection: 'hot-tub-cabins',
    relatedCategorySlug: 'cabins',
    relatedCategoryLabel: 'All cabin rentals',
    hub: {
      h1: 'Cabins with Hot Tubs: 15 Best Towns for a Private-Hot-Tub Cabin',
      metaDescription:
        'Compare whole-home cabins with private hot tubs across 15 top VRBO towns, from Gatlinburg to Lake Tahoe, with real areas, seasons, and nightly price bands.',
      intro:
        "A private hot tub is the small luxury that turns a cabin trip into a proper reset, and a handful of American towns have built entire rental markets around it. This guide breaks down 15 of the best, from the Smoky Mountains hubs of Gatlinburg and Pigeon Forge to Broken Bow, Big Bear, and Lake Tahoe, with the real sub-areas, seasons, and price ranges for each. Every listing points to whole-home log and timber cabins on VRBO, so you get the deck, the trees, and the tub to yourselves.",
    },
    towns: [
      {
        townSlug: 'gatlinburg',
        town: 'Gatlinburg',
        state: 'TN',
        vrboDestination: 'Gatlinburg, Tennessee, USA',
        metaDescription:
          'Book whole-home log cabins with private hot tubs in Gatlinburg, TN on VRBO. Compare Chalet Village and Cobbly Nob areas, seasons, and nightly prices.',
        intro:
          "Perched on the steep, wooded ridges just above downtown, Gatlinburg's Chalet Village and Ski Mountain Road neighborhoods hold the densest cluster of log and timber cabins with private hot tubs anywhere in the Smokies. From a deck off Wiley Oakley Drive you can soak while the lights of the Parkway glitter below and Mount LeConte fills the horizon. Most homes here are true whole-house rentals, from one-bedroom honeymoon A-frames to seven-bedroom group lodges, and Chalet Village owners often share a seasonal clubhouse with pools and tennis courts. East of town, the quieter Cobbly Nob area near the Greenbrier park entrance trades nightlife proximity for handcrafted cabins and deep-woods privacy. Whichever ridge you choose, you are minutes from Ober Mountain, the Roaring Fork Motor Nature Trail, and the main Great Smoky Mountains National Park entrance, so the hot tub is the reward at the end of a full day outdoors.",
        bestAreas:
          'Chalet Village and the Ski Mountain Road corridor put you closest to downtown and Ober Mountain, while Cobbly Nob and the Great Smoky Arts and Crafts Community along Glades Road east of town feel more secluded.',
        whenToBook:
          "Book three to six months out for October leaf season and the Christmas-to-New-Year stretch, Gatlinburg's two busiest windows; January and midweek spring dates bring the softest rates.",
        priceBand:
          'A one- to three-bedroom hot-tub cabin typically runs about $180 to $400 a night, with large multi-bedroom lodges climbing past $600 in peak fall and holiday weeks.',
        faqs: [
          {
            q: 'Which area of Gatlinburg has the best hot-tub cabins?',
            a: 'Chalet Village and Ski Mountain, on the ridges directly above downtown, have the highest concentration of hot-tub cabins with skyline and Mount LeConte views. For more privacy and handcrafted homes, look east to Cobbly Nob near the Greenbrier entrance.',
          },
          {
            q: "Are Gatlinburg's hot-tub cabins within walking distance of the Parkway?",
            a: 'A few lower Ski Mountain Road cabins are a short drive or steep walk from the Parkway, but most Chalet Village and Cobbly Nob homes sit up winding mountain roads, so plan to drive the five to fifteen minutes into town.',
          },
          {
            q: 'Do Gatlinburg cabin hot tubs stay usable in winter?',
            a: 'Yes. Hot tubs here run year-round, and soaking on a cold, clear night after a day in the snow-dusted national park or at Ober Mountain is one of the main reasons people book a Gatlinburg cabin in winter.',
          },
        ],
      },
      {
        townSlug: 'pigeon-forge',
        town: 'Pigeon Forge',
        state: 'TN',
        vrboDestination: 'Pigeon Forge, Tennessee, USA',
        metaDescription:
          'Find whole-home cabins with private hot tubs near Dollywood in Pigeon Forge, TN on VRBO. Compare Upper Middle Creek and Sky Harbor areas and prices.',
        intro:
          "Dollywood, The Island, and miles of neon Parkway give Pigeon Forge its family-vacation reputation, but the cabins sit up in the hills on either side of that valley floor. The largest concentration lines Upper Middle Creek Road and the Sky Harbor area, wooded ridges close enough to reach Dollywood or the go-kart tracks in ten minutes yet high enough for a hot tub with a real Smoky Mountain view. Just west, the Wears Valley Road corridor climbs toward quieter timber lodges with pastoral valley outlooks. Rentals here skew toward big, amenity-loaded whole homes built for groups and multi-generational trips: theater rooms, pool tables, multiple decks, and hot tubs are close to standard. It is the middle ground of the area, more built-up and convenient than Wears Valley or Cobbly Nob but far tamer than downtown Gatlinburg, which makes it the practical pick for families who want attractions by day and a private soak by night.",
        bestAreas:
          'Upper Middle Creek Road and Sky Harbor keep you closest to Dollywood and the Parkway, while cabins along Wears Valley Road and Bluff Mountain trade a few extra minutes of driving for bigger views and more seclusion.',
        whenToBook:
          'Summer and the fall foliage weeks are peak, and Winterfest lighting draws crowds from November into January; late winter and non-holiday spring midweeks are easiest on both rates and traffic.',
        priceBand:
          'Expect roughly $170 to $375 a night for a one- to three-bedroom hot-tub cabin, with large lodges that sleep a dozen or more running $450 and up during summer and leaf season.',
        faqs: [
          {
            q: 'Where should I stay in Pigeon Forge for a cabin close to Dollywood?',
            a: 'The Upper Middle Creek Road and Sky Harbor areas are the closest cabin clusters to Dollywood, most within about a ten-minute drive, while still sitting up on wooded ridges with hot-tub views.',
          },
          {
            q: 'Are Pigeon Forge cabins good for large groups?',
            a: 'Very. Pigeon Forge specializes in big whole-home lodges with six to twelve-plus bedrooms, game and theater rooms, and multiple hot tubs, which makes it a popular pick for family reunions and multi-family trips.',
          },
          {
            q: 'Is Pigeon Forge or Gatlinburg better for a hot-tub cabin?',
            a: 'Pigeon Forge cabins are generally roomier, more group-oriented, and closer to Dollywood and the go-kart strip, while Gatlinburg cabins sit nearer downtown and the main national park entrance. Both have huge hot-tub inventories.',
          },
        ],
      },
      {
        townSlug: 'broken-bow',
        town: 'Broken Bow',
        state: 'OK',
        vrboDestination: 'Broken Bow, Oklahoma, USA',
        metaDescription:
          'Rent whole-home Hochatown cabins with private hot tubs near Beavers Bend and Broken Bow Lake, OK on VRBO. Compare areas, seasons, and prices.',
        intro:
          "Barely a decade ago Hochatown was a sleepy crossroads north of Broken Bow; today it is one of the fastest-growing cabin markets in the country, with hundreds of hot-tub cabins tucked into the pines around Beavers Bend State Park. Most sit within a few minutes of Broken Bow Lake or the trout-stocked Lower Mountain Fork River, and the classic build here is a modern A-frame or log cabin with a screened porch, an outdoor hot tub, and a fire pit under tall shortleaf pines. Because the whole district grew up around vacation rentals rather than a historic town, homes tend to be newer and heavy on amenities: game rooms, outdoor kitchens, and pet-friendly fenced yards are common. You can spend the day paddling the lake, fly-fishing below the dam, or wine-tasting at Girls Gone Wine, then be back in the tub before dark. Most guests are weekenders from Dallas or Oklahoma City, and the cabins' polish reflects that demand.",
        bestAreas:
          'Hochatown, just north of Broken Bow on U.S. 259, is the heart of the cabin scene and closest to Beavers Bend State Park and the Broken Bow Lake dam; the Stevens Gap area holds many of the lakeside and higher-view properties.',
        whenToBook:
          'Fall weekends and the summer lake season book earliest, and Texas school holidays drive demand; midweek stays and the January-February lull offer the best value and quietest trails.',
        priceBand:
          'A newer two- to three-bedroom hot-tub cabin generally runs about $200 to $400 a night, with luxury and lakefront builds well above that on peak weekends.',
        faqs: [
          {
            q: 'Is Hochatown or Broken Bow better for a hot-tub cabin?',
            a: 'They function as one destination. Hochatown, just north of the city of Broken Bow, is where nearly all the vacation cabins, restaurants, and the Beavers Bend park entrance are, so most hot-tub cabins carry a Hochatown or Broken Bow address interchangeably.',
          },
          {
            q: 'How close are the cabins to Broken Bow Lake and Beavers Bend?',
            a: 'Most Hochatown cabins are within five to fifteen minutes of both Broken Bow Lake and Beavers Bend State Park, and a subset along Stevens Gap and the lake sit even closer with water views.',
          },
          {
            q: 'Are Broken Bow cabins pet-friendly?',
            a: 'Many are. Because most cabins here are newer, purpose-built rentals, a large share allow dogs and include fenced yards, though you should filter for pet-friendly on VRBO and check each cabin\'s pet fees and limits.',
          },
        ],
      },
      {
        townSlug: 'blue-ridge',
        town: 'Blue Ridge',
        state: 'GA',
        vrboDestination: 'Blue Ridge, Georgia, USA',
        metaDescription:
          'Book whole-home cabins with private hot tubs in Blue Ridge, GA on VRBO. Compare the Aska Adventure Area, Toccoa River, seasons, and prices.',
        intro:
          "The Aska Adventure Area, a pocket of Chattahoochee National Forest southeast of downtown Blue Ridge, is where most of this town's hot-tub cabins hide, strung along the Toccoa River and the ridgelines above Lake Blue Ridge. Handcrafted log and timber homes here lean rustic-luxury, with wraparound porches, stone fireplaces, and hot tubs angled at the water or the surrounding peaks. Downtown Blue Ridge is a genuine draw in its own right, a walkable stretch of restored storefronts anchored by the depot of the Blue Ridge Scenic Railway, which runs along the Toccoa to the twin border towns of McCaysville and Copperhill. Days fill up easily with tubing or trout fishing on the Toccoa, kayaking on Lake Blue Ridge, and apple season at Mercier Orchards just north of town. Because it is only about ninety minutes from Atlanta, Blue Ridge fills fast on weekends, and its cabins are a favorite for couples and small groups.",
        bestAreas:
          'The Aska Adventure Area along Aska Road holds the highest concentration of riverside and mountain-view cabins, while homes nearer Lake Blue Ridge and the Highway 515 side put you closer to downtown and the marina.',
        whenToBook:
          "October, when the North Georgia leaves peak and Mercier's apple season is in full swing, is the busiest and priciest month; book well ahead, or come in late spring for green rivers and lower rates.",
        priceBand:
          'Most one- to three-bedroom hot-tub cabins run about $175 to $375 a night, climbing for Toccoa riverfront or larger luxury lodges during fall color.',
        faqs: [
          {
            q: 'Which part of Blue Ridge has the best cabins with hot tubs?',
            a: 'The Aska Adventure Area, reached via Aska Road southeast of downtown, is the prime cabin zone, with hot-tub homes along the Toccoa River and on ridges overlooking Lake Blue Ridge.',
          },
          {
            q: 'Can you get a cabin on the Toccoa River in Blue Ridge?',
            a: 'Yes. A number of Aska-area cabins sit directly on the Toccoa with private river frontage, and many pair that with a hot tub; these book earliest, especially for summer tubing season and fall weekends.',
          },
          {
            q: 'How far is downtown Blue Ridge from the Aska cabins?',
            a: 'Most Aska Adventure Area cabins are about a ten- to twenty-minute drive from downtown Blue Ridge and its Scenic Railway depot, close enough for dinner in town but far enough to feel secluded.',
          },
        ],
      },
      {
        townSlug: 'big-bear',
        town: 'Big Bear',
        state: 'CA',
        vrboDestination: 'Big Bear Lake, California, USA',
        metaDescription:
          'Find whole-home log cabins with private hot tubs in Big Bear Lake, CA on VRBO. Compare Moonridge, Fox Farm, and Boulder Bay areas and prices.',
        intro:
          "At nearly 6,750 feet in the San Bernardino Mountains, Big Bear Lake is Southern California's four-season cabin town, close enough for a weekend from Los Angeles yet high enough for real pine forest and winter snow. Hot-tub cabins spread through several distinct neighborhoods: Moonridge, near Bear Mountain resort and the Alpine Zoo; Fox Farm, whose Castle Glen Estates holds some of the grandest log homes in town; Boulder Bay on the lake's quiet west inlet; and forested, more affordable Sugarloaf just outside the city. Many are genuine timber cabins with wood interiors, stone hearths, and decks where the hot tub looks into the pines or toward the ski runs. The mix of Snow Summit and Bear Mountain skiing in winter, the lake and Alpine Slide in summer, and The Village's shops year-round keeps demand steady. It is the rare hot-tub-cabin market where you might soak after snowboarding in February or after wakeboarding in July.",
        bestAreas:
          'Moonridge and Fox Farm sit closest to Bear Mountain and hold many of the larger log homes, Boulder Bay hugs a scenic west-lake inlet, and Sugarloaf and Big Bear City to the east offer more cabin for the money.',
        whenToBook:
          'Winter weekends and holiday weeks tied to Snow Summit and Bear Mountain skiing are the peak; book a month or more ahead for snow season, while spring and early summer midweeks are the quietest and cheapest.',
        priceBand:
          'Plan on roughly $200 to $425 a night for a two- to three-bedroom hot-tub cabin, with ski-weekend and holiday pricing and larger estate homes running higher.',
        faqs: [
          {
            q: 'Which Big Bear neighborhood is best for a hot-tub cabin?',
            a: 'Moonridge and Fox Farm are top picks for larger log cabins near Bear Mountain, Boulder Bay suits those wanting a quiet lakeside setting, and Sugarloaf offers more affordable forested cabins a few minutes east of the action.',
          },
          {
            q: 'Do Big Bear cabins have hot tubs usable in the snow?',
            a: 'Yes, and it is a signature Big Bear experience. Cabins in Moonridge and near Snow Summit are set up for winter soaking, so you can warm up in the hot tub after a day on the slopes.',
          },
          {
            q: 'How far is Big Bear from Los Angeles for a cabin weekend?',
            a: 'Big Bear Lake is roughly a two to two-and-a-half hour drive from Los Angeles, up either Highway 18 or 38, which makes it a popular quick getaway and means cabins book fast for winter and holiday weekends.',
          },
        ],
      },
      {
        townSlug: 'helen',
        town: 'Helen',
        state: 'GA',
        vrboDestination: 'Helen, Georgia, USA',
        metaDescription:
          'Book whole-home cabins with private hot tubs in Helen, GA on VRBO. Compare Chattahoochee River and Unicoi areas, seasons, and nightly prices.',
        intro:
          "Rebuilt in the 1960s to resemble a Bavarian alpine village, pint-sized Helen wears cobblestone alleys and gingerbread trim, but step a mile or two out and you are in ordinary North Georgia mountain forest thick with cabins. The Chattahoochee River runs right through the middle of town, and summer days revolve around tubing its gentle current, so many hot-tub cabins sit within walking or short-driving distance of a riverbank. Just north, Unicoi State Park and the twin cascades of Anna Ruby Falls anchor the hiking, while the Nacoochee and Sautee valleys south of town add covered bridges, wineries, and pastoral views. Cabins range from cozy one-bedroom creekside A-frames to larger family log homes, most with a hot tub on a wooded deck. Helen leans festive, peaking during its long autumn Oktoberfest, which makes it a lively, walkable-to-dinner base rather than a remote-wilderness one.",
        bestAreas:
          'Cabins right around downtown and along the Chattahoochee put you closest to tubing and the shops, while the Sautee and Nacoochee valleys and the roads toward Unicoi State Park offer quieter, more spread-out mountain settings.',
        whenToBook:
          "Helen's Oktoberfest stretches across September through October and, with fall color, makes autumn by far the busiest and priciest season; summer tubing weekends are also strong, while winter is calm and inexpensive.",
        priceBand:
          'A one- to three-bedroom hot-tub cabin typically runs about $150 to $325 a night, with riverfront and larger group cabins higher during Oktoberfest weekends.',
        faqs: [
          {
            q: 'Are there hot-tub cabins within walking distance of downtown Helen?',
            a: 'A handful of cabins and chalets sit along the Chattahoochee just off the village, close enough to walk to Oktoberfest and the shops, but most hot-tub cabins are a short drive out in the surrounding hills and valleys.',
          },
          {
            q: 'Can you tube the Chattahoochee from a Helen cabin?',
            a: 'Yes. Tubing the Chattahoochee through town is Helen\'s signature summer activity, and many cabins are minutes from the tube outfitters, so you can float the river by day and use the hot tub at night.',
          },
          {
            q: 'When is Oktoberfest in Helen and how does it affect cabin prices?',
            a: 'Helen runs one of the longest Oktoberfests in the country, spanning parts of September through late October. Cabin rates and minimum-night rules rise sharply on those fall weekends, so book several months ahead.',
          },
        ],
      },
      {
        townSlug: 'hocking-hills',
        town: 'Hocking Hills',
        state: 'OH',
        vrboDestination: 'Hocking Hills, Ohio, USA',
        metaDescription:
          "Rent whole-home cabins with private hot tubs in Hocking Hills, OH on VRBO. Compare South Bloomingville, Old Man's Cave areas, and nightly prices.",
        intro:
          "Nowhere else in Ohio looks quite like the Hocking Hills, a rumpled band of hemlock gorges, recessed sandstone caves, and waterfalls southeast of Columbus that has quietly become the Midwest's cabin-and-hot-tub capital. The rentals scatter through tiny communities like South Bloomingville, Rockbridge, and Logan, most set on private wooded acreage rather than in any town center, so the standard package is a secluded log cabin with a hot tub on the deck and no neighbors in sight. State-park landmarks drive the trips: Old Man's Cave, Ash Cave, Cedar Falls, Conkle's Hollow, and Cantwell Cliffs are all within a short drive, linked by the Grandma Gatewood Trail. Because most guests come from Columbus, Cincinnati, and Cleveland for a two-night reset, cabins here emphasize romance and quiet, think fireplaces, star-filled skies, and outdoor soaking, over nightlife. It is a year-round draw, busiest when the leaves turn and surprisingly magical after a light snow.",
        bestAreas:
          "South Bloomingville and the roads around Old Man's Cave put you closest to the marquee gorges, while Rockbridge, Logan, and the Lake Logan area sit a bit north with easy access and slightly more dining.",
        whenToBook:
          'Fall is peak, with October weekends selling out months ahead thanks to leaf season; summer is strong too, but winter and non-holiday weekdays are the quietest and cheapest time to snag a hot-tub cabin.',
        priceBand:
          'Most one- to two-bedroom hot-tub cabins run about $150 to $300 a night, with larger lodges and hot-tub-plus-sauna romantic cabins higher on fall and holiday weekends.',
        faqs: [
          {
            q: 'Do most Hocking Hills cabins come with a hot tub?',
            a: 'Yes, a private hot tub is close to standard in the Hocking Hills. The area\'s cabins are built around secluded couples and family getaways, so the large majority include an outdoor hot tub along with a fireplace and grill.',
          },
          {
            q: "Which Hocking Hills town is closest to Old Man's Cave?",
            a: "South Bloomingville is the community nearest Old Man's Cave and Conkle's Hollow, while cabins in Rockbridge and Logan are a short drive north but still within fifteen to twenty minutes of the main gorges.",
          },
          {
            q: 'Is Hocking Hills good for a romantic couples cabin?',
            a: 'It is one of the Midwest\'s top spots for it. Many cabins are one-bedroom, adults-oriented retreats on private wooded lots with hot tubs, fireplaces, and no near neighbors, marketed squarely at couples and anniversaries.',
          },
        ],
      },
      {
        townSlug: 'sevierville',
        town: 'Sevierville',
        state: 'TN',
        vrboDestination: 'Sevierville, Tennessee, USA',
        metaDescription:
          'Find whole-home cabins with private hot tubs in Sevierville, TN on VRBO. Compare English Mountain and Douglas Lake areas, seasons, and prices.',
        intro:
          "As the first Sevier County town travelers reach coming off Interstate 40, Sevierville is the low-key, more residential gateway that sits just north of Pigeon Forge and Gatlinburg. Its hot-tub cabins tend to be spread over a wider, greener footprint, from the slopes of English Mountain on the east side to the shoreline of Douglas Lake and the rural Kodak and Boyds Creek areas. That extra elbow room often means bigger lots, longer views, and slightly softer prices than the tourist strips a few miles south, while Dollywood still sits only about fifteen minutes away. You will find everything from Amish-built log cabins with wraparound porches to lakefront homes with private docks, most with a hot tub facing the Smokies or the water. Sevierville works well for travelers who want a quieter, more spread-out base but still expect quick access to the parkways, outlets, and the national park entrance beyond Gatlinburg.",
        bestAreas:
          'English Mountain on the east side and the Douglas Lake shoreline hold the biggest-view and waterfront cabins, while the Kodak and Boyds Creek areas near I-40 keep you close to the interstate and the Sevierville-Pigeon Forge parkway.',
        whenToBook:
          'Sevierville tracks the wider Smokies calendar, peaking in summer and October leaf season; because it is less tourist-driven than Pigeon Forge, midweek and winter cabins here are often the best value in the area.',
        priceBand:
          'Expect roughly $150 to $350 a night for a two- to three-bedroom hot-tub cabin, with Douglas Lake waterfront and large group lodges above that in peak months.',
        faqs: [
          {
            q: 'Is Sevierville a good base for visiting the Smoky Mountains?',
            a: 'Yes. Sevierville sits just north of Pigeon Forge, about fifteen minutes from Dollywood and roughly thirty from the Gatlinburg park entrance, so a hot-tub cabin here keeps you close to the attractions while feeling more spread out and residential.',
          },
          {
            q: 'Can you rent a lakefront hot-tub cabin in Sevierville?',
            a: 'You can. The Douglas Lake shoreline on Sevierville\'s north and east side has cabins with private docks and hot tubs, popular for boating and fishing trips and generally quieter than the mountain-view cabins nearer the parkway.',
          },
          {
            q: 'Are Sevierville cabins cheaper than Gatlinburg or Pigeon Forge?',
            a: 'Often, yes. Because Sevierville is less central to the tourist strips, comparable hot-tub cabins here can run a bit less, especially on the English Mountain and Douglas Lake sides, though peak-season rates still climb.',
          },
        ],
      },
      {
        townSlug: 'wears-valley',
        town: 'Wears Valley',
        state: 'TN',
        vrboDestination: 'Wears Valley, Tennessee, USA',
        metaDescription:
          'Book whole-home log cabins with private hot tubs in Wears Valley, TN on VRBO. Compare ridge areas near Cove Mountain, seasons, and prices.',
        intro:
          "Locals call it the quiet side of the Smokies, and Wears Valley earns the nickname, a narrow farm-dotted trough of pasture and forest wedged between Pigeon Forge and Townsend beneath 4,078-foot Cove Mountain. The cabins climb the ridges on either side of U.S. 321, in pockets with names like Wonderland Ridge, Hickory Hollow, and Wilderness Mountain, most of them log or timber homes set for privacy with a hot tub angled at the valley or the mountains. What sells the area is the balance: a national park backdoor at the Metcalf Bottoms picnic area and the Little River is minutes away, the newly finished Wears Valley section of the Foothills Parkway offers some of the best long-range views in the Smokies, yet the Pigeon Forge Parkway and Dollywood are still only about ten minutes down the hill. It is the pick for people who want scenery and stillness without going fully remote.",
        bestAreas:
          'Cabins along Wears Valley Road (U.S. 321) and up developments like Wonderland Ridge and Wilderness Mountain give the classic valley-and-ridge views, while the Line Springs Road side sits closest to the Metcalf Bottoms park entrance.',
        whenToBook:
          'Like the rest of the Smokies, Wears Valley peaks in summer and October; its smaller cabin inventory means fall foliage weekends sell out early, so reserve months ahead, while winter offers quiet and low rates.',
        priceBand:
          'A one- to three-bedroom hot-tub cabin here generally runs about $150 to $325 a night, with larger view lodges higher in peak summer and leaf season.',
        faqs: [
          {
            q: 'Where exactly is Wears Valley and why choose it over Pigeon Forge?',
            a: 'Wears Valley is a rural valley between Pigeon Forge and Townsend, beneath Cove Mountain. People choose it over Pigeon Forge for the quieter setting, mountain and pasture views, and quick park access, while still being about ten minutes from Dollywood.',
          },
          {
            q: 'How close are Wears Valley cabins to the national park?',
            a: 'Very close. From U.S. 321, Line Springs Road reaches the Metcalf Bottoms picnic area and the Little River inside Great Smoky Mountains National Park in roughly five to ten minutes, one of the area\'s less-crowded park entrances.',
          },
          {
            q: 'Is the Foothills Parkway worth it from a Wears Valley cabin?',
            a: 'Yes. The Wears Valley-to-Walland section of the Foothills Parkway, completed in 2018 after decades of construction, starts minutes from many cabins and delivers some of the widest long-range views in the Smokies, especially at sunset.',
          },
        ],
      },
      {
        townSlug: 'asheville',
        town: 'Asheville',
        state: 'NC',
        vrboDestination: 'Asheville, North Carolina, USA',
        metaDescription:
          'Find whole-home cabins with private hot tubs near Asheville, NC on VRBO. Compare Leicester, Candler, and Fairview areas, seasons, and prices.',
        intro:
          "Most Asheville hot-tub cabins sit well beyond the city limits, ringing the mountains in communities like Leicester, Candler, Fairview, and Weaverville, typically a fifteen- to twenty-five-minute drive from downtown. That geography is the appeal: you get a wooded log or timber cabin with a hot tub facing layered Blue Ridge ridgelines, then reach the breweries, the River Arts District, and the Biltmore Estate in well under half an hour. The Blue Ridge Parkway threads the high ground just south and east of the city, putting overlooks and Pisgah National Forest trailheads within easy reach, while the French Broad River draws paddlers and tubers below. Cabins here span rustic couples' retreats to large group homes, many pitched at wedding parties and leaf-season travelers. Because Asheville is one of the Southeast's most popular mountain destinations, its cabins book early and price higher than most towns on this list, particularly in October.",
        bestAreas:
          'Leicester and Weaverville to the north and Candler and Fairview to the west and south hold most of Asheville\'s hot-tub cabins, each roughly twenty minutes from downtown and close to Blue Ridge Parkway access.',
        whenToBook:
          "October is Asheville's crescendo, when leaf-peepers and weddings push cabins to their highest rates and longest minimum stays; book well ahead for fall, and target winter or midweek for the best deals.",
        priceBand:
          'Most two- to three-bedroom hot-tub cabins run about $175 to $400 a night, with luxury and view homes higher, and October pricing among the steepest of any town here.',
        faqs: [
          {
            q: 'Are there hot-tub cabins right in Asheville, or only outside town?',
            a: 'A few sit close to the River Arts District and West Asheville, but the large majority of true log and timber hot-tub cabins are in the surrounding communities, Leicester, Candler, Fairview, and Weaverville, roughly fifteen to twenty-five minutes out.',
          },
          {
            q: 'How far are Asheville cabins from the Biltmore and downtown?',
            a: 'Most cabins in the ring of nearby communities are fifteen to twenty-five minutes from both downtown Asheville and the Biltmore Estate, close enough for dinner and breweries in the evening and a mountain-view hot tub at night.',
          },
          {
            q: 'When is the best time to book an Asheville cabin for fall color?',
            a: 'For peak Blue Ridge color, mid-to-late October, reserve four to six months ahead. That window is Asheville\'s busiest and priciest, and desirable hot-tub cabins with good views are the first to sell out.',
          },
        ],
      },
      {
        townSlug: 'poconos',
        town: 'Poconos',
        state: 'PA',
        vrboDestination: 'Pocono Mountains, Pennsylvania, USA',
        metaDescription:
          'Rent whole-home cabins with private hot tubs in the Pocono Mountains, PA on VRBO. Compare Lake Wallenpaupack and Lake Harmony areas and prices.',
        intro:
          "The Poconos is not one town but a 2,400-square-mile sweep of northeastern Pennsylvania, a longtime weekend escape for New York City and Philadelphia that is dense with lake communities and cabin rentals. Hot-tub cabins concentrate around the water and the ski hills: Lake Wallenpaupack, the region's biggest lake, near Hawley; the gated Arrowhead Lake and Lake Naomi communities around Pocono Pines; and Lake Harmony with the Split Rock area, close to the Jack Frost and Big Boulder slopes. Homes range from cozy A-frames to sprawling contemporary lodges, and many gated communities add beaches, pools, and boat launches on top of the private hot tub. Attractions are spread out, Camelback and Kalahari for families, Bushkill Falls for hikers, the Lehigh River for rafters, so a car is essential. The payoff is four true seasons: skiing and snow-tubing in winter, lake life in summer, and hot-tub soaking under the stars year-round.",
        bestAreas:
          'For lake life, look at Lake Wallenpaupack near Hawley or the gated Arrowhead Lake, Lake Naomi, and Pocono Pines communities; for skiing, Lake Harmony and Split Rock sit closest to Jack Frost and Big Boulder.',
        whenToBook:
          'The Poconos is genuinely four-season: winter ski weekends and summer lake weeks are both peaks, plus fall color; book holiday and ski weekends a month or more out, with spring and late fall the quietest.',
        priceBand:
          'Expect roughly $175 to $375 a night for a two- to three-bedroom hot-tub cabin, with lakefront homes and large ski-season lodges running higher on peak weekends.',
        faqs: [
          {
            q: 'Which part of the Poconos is best for a hot-tub cabin?',
            a: 'It depends on your trip. For lakes, Lake Wallenpaupack near Hawley and the Arrowhead Lake and Lake Naomi communities near Pocono Pines are top choices; for skiing, base near Lake Harmony and Split Rock by Jack Frost and Big Boulder.',
          },
          {
            q: 'Do Poconos cabins in gated lake communities include amenities?',
            a: 'Often yes. Communities like Arrowhead Lake and Lake Naomi provide members and their renters access to private beaches, pools, and boat launches, which stack on top of a cabin\'s own private hot tub, though access rules vary by rental.',
          },
          {
            q: 'Can you use a Poconos cabin hot tub year-round?',
            a: 'Yes. The Poconos is a four-season area, and hot tubs run all year. Soaking after skiing at Jack Frost or Big Boulder in winter is as common as using it after a summer day on Lake Wallenpaupack.',
          },
        ],
      },
      {
        townSlug: 'branson',
        town: 'Branson',
        state: 'MO',
        vrboDestination: 'Branson, Missouri, USA',
        metaDescription:
          'Book whole-home Table Rock Lake cabins with private hot tubs in Branson, MO on VRBO. Compare Indian Point areas, seasons, and nightly prices.',
        intro:
          "Two very different lakes bracket Branson, and they shape where its cabins sit: sprawling Table Rock Lake to the southwest, ringed by wooded coves and marinas, and narrow, cold Lake Taneycomo below the dam, a blue-ribbon trout stream. Most hot-tub cabins cluster on the Table Rock side, especially out the Indian Point peninsula next to Silver Dollar City, where log and timber homes step down forested hillsides toward the water with hot tubs on the deck. Branson's famous entertainment strip, Highway 76, with its theaters, mini-golf, and the Branson Landing shops, stays about ten to fifteen minutes away, so you can pair a show-and-attractions day with a quiet lakeside soak at night. The area draws heavily from the Midwest and works for both families and couples. Boating, fishing, and Silver Dollar City are the anchors, and cabins with a dock or a lake view command the premium.",
        bestAreas:
          'Indian Point, the peninsula beside Silver Dollar City, has the densest run of Table Rock Lake cabins with hot tubs, while the Kimberling City and Table Rock State Park areas spread farther around the lake\'s coves.',
        whenToBook:
          "Summer is Branson's high season for lake and show traffic, and the Christmas lights of Silver Dollar City's Old Time Christmas make November-December a second peak; spring and fall midweeks are calmer and cheaper.",
        priceBand:
          'A two- to three-bedroom hot-tub cabin typically runs about $150 to $350 a night, with lakefront and dock properties on Table Rock higher during the summer season.',
        faqs: [
          {
            q: "Where are most of Branson's hot-tub cabins located?",
            a: 'The majority sit on the Table Rock Lake side southwest of town, especially along the Indian Point peninsula next to Silver Dollar City, where wooded cabins with hot tubs and lake views are concentrated about ten to fifteen minutes from the Highway 76 strip.',
          },
          {
            q: 'Can you get a lakefront cabin with a hot tub and dock in Branson?',
            a: 'Yes. Table Rock Lake has many cabins with private or shared docks paired with hot tubs, popular for boating and fishing trips; these lakefront homes are the priciest option and book earliest for summer.',
          },
          {
            q: 'How far are Branson cabins from Silver Dollar City and the shows?',
            a: 'Indian Point cabins are only a few minutes from Silver Dollar City and about ten to fifteen from the Highway 76 theaters and Branson Landing, so a lake cabin still keeps you close to all the attractions.',
          },
        ],
      },
      {
        townSlug: 'ruidoso',
        town: 'Ruidoso',
        state: 'NM',
        vrboDestination: 'Ruidoso, New Mexico, USA',
        metaDescription:
          'Find whole-home log cabins with private hot tubs in Ruidoso, NM on VRBO. Compare the Upper Canyon and Alto areas, seasons, and nightly prices.',
        intro:
          "Elevation shapes nearly everything in Ruidoso, a mountain village set around 7,000 feet in the pine forests of southern New Mexico, where the Rio Ruidoso runs cold and the 11,981-foot summit of Sierra Blanca towers overhead. The most coveted hot-tub cabins line the Upper Canyon, a leafy stretch of ponderosa pines along the river just above the shops of Midtown, where classic log cabins sit steps from the water. Higher and to the north, the Alto area near Alto Lake and the road to Ski Apache holds newer homes with big mountain views. Because Ruidoso draws desert-dwellers escaping the heat of Texas and southern New Mexico, summer is its true high season, cool days, horse racing at Ruidoso Downs, and evenings warm enough for the hot tub. Winter adds skiing at Ski Apache, run by the Mescalero Apache, making the town a genuine year-round cabin escape.",
        bestAreas:
          'The Upper Canyon along the Rio Ruidoso above Midtown is the classic cabin district, walkable to shops and the river, while the Alto area to the north, near Alto Lake and the Ski Apache road, offers newer builds and bigger views.',
        whenToBook:
          'Unlike most mountain towns, Ruidoso peaks in summer, when Texans flee the heat and Ruidoso Downs racing runs, and again over ski weekends at Ski Apache; late spring and fall are the quiet, lower-priced shoulders.',
        priceBand:
          'Most one- to three-bedroom hot-tub cabins run about $150 to $325 a night, with Upper Canyon riverfront and larger Alto view homes higher in peak summer and ski weekends.',
        faqs: [
          {
            q: 'Which area of Ruidoso has the best cabins?',
            a: 'The Upper Canyon is the most sought-after, with log cabins tucked in the ponderosa pines along the Rio Ruidoso, a short walk from Midtown. For newer homes with mountain views, the Alto area north of town near Alto Lake and Ski Apache is the alternative.',
          },
          {
            q: 'Is Ruidoso busier in summer or winter?',
            a: 'Summer is Ruidoso\'s true high season, as visitors from Texas and the New Mexico deserts come up for the cool 7,000-foot air and Ruidoso Downs horse racing. Winter is a strong second peak thanks to skiing at Ski Apache.',
          },
          {
            q: 'How close are Ruidoso cabins to Ski Apache?',
            a: 'Ski Apache sits up on Sierra Blanca, roughly a thirty- to forty-five-minute drive from most cabins. Homes in the Alto area north of town are closest to the access road, while Upper Canyon cabins trade that for river-and-Midtown walkability.',
          },
        ],
      },
      {
        townSlug: 'lake-tahoe',
        town: 'Lake Tahoe',
        state: 'CA',
        vrboDestination: 'Lake Tahoe, California, USA',
        metaDescription:
          'Book whole-home cabins with private hot tubs at Lake Tahoe, CA on VRBO. Compare South Lake Tahoe and West Shore areas, seasons, and prices.',
        intro:
          "California claims the south and west arcs of Lake Tahoe, and the cabin experience splits sharply between them. Busy South Lake Tahoe pairs cabins with the casinos just over the Nevada line and the Heavenly gondola, so hot-tub homes here sit minutes from nightlife and the biggest ski resort. The West Shore is the quieter counterpoint, a string of wooded, old-Tahoe hamlets, Tahoma, Homewood, Meeks Bay, that trade neon for pine-shaded lanes, small beaches, and Homewood's low-key slopes. Cabins across both range from vintage 1950s log builds to modern A-frames, most with a hot tub for soaking after a day on the snow or the water. Emerald Bay, Camp Richardson, and the Rubicon Trail anchor the scenery between them. Tahoe is a premium market with two full seasons, deep winters for skiing and warm alpine summers for the lake, so cabins here price higher and book earlier than most.",
        bestAreas:
          'South Lake Tahoe puts you near Heavenly, the beaches, and the state-line casinos, while the West Shore hamlets of Tahoma, Homewood, and Meeks Bay offer quieter, more classic Tahoe cabins close to Homewood\'s slopes and Emerald Bay.',
        whenToBook:
          'Tahoe runs two peaks, ski season from the holidays through March and the July-August lake summer; both book far ahead, especially winter holiday weeks, while the fall and late-spring shoulders are quietest and cheapest.',
        priceBand:
          'Tahoe is a premium market: most two- to three-bedroom hot-tub cabins run about $250 to $550 a night, with lakefront and ski-in-area homes climbing well beyond during holiday weeks.',
        faqs: [
          {
            q: 'Should I book a cabin in South Lake Tahoe or the West Shore?',
            a: 'South Lake Tahoe is livelier, close to Heavenly, the casinos, and the most dining, while the West Shore, Tahoma, Homewood, and Meeks Bay, is quieter and more classic-Tahoe. Both have hot-tub cabins; pick by whether you want nightlife or seclusion.',
          },
          {
            q: 'Are Lake Tahoe cabin hot tubs good for after skiing?',
            a: 'Yes, that is a core part of the appeal. Cabins near South Lake Tahoe\'s Heavenly and on the West Shore near Homewood are set up for winter soaking, so you can thaw out in the hot tub after a day on the mountain.',
          },
          {
            q: 'Why are Lake Tahoe cabins more expensive than other towns?',
            a: 'Tahoe is one of the West\'s premier four-season resort areas with limited cabin inventory and high demand from the Bay Area and Sacramento. That combination, plus two strong seasons, keeps nightly rates and minimum stays above most other cabin markets.',
          },
        ],
      },
      {
        townSlug: 'leavenworth',
        town: 'Leavenworth',
        state: 'WA',
        vrboDestination: 'Leavenworth, Washington, USA',
        metaDescription:
          'Rent whole-home cabins with private hot tubs in Leavenworth, WA on VRBO. Compare Icicle Road and Lake Wenatchee areas, seasons, and prices.',
        intro:
          "The Wenatchee River runs straight through Leavenworth, a former timber town that reinvented itself in the 1960s as a Bavarian-themed village and now packs alpine-styled storefronts beneath the granite walls of the Cascades. Cabins sit just outside that compact downtown, many up Icicle Road along Icicle Creek, where timber homes tuck into the pines with a hot tub facing the peaks, and others scattered toward Lake Wenatchee and along the dramatic Tumwater Canyon stretch of Highway 2. The setting is genuine alpine: Stevens Pass skiing and snow play in winter, river rafting and hiking into the Enchantments in summer, and Oktoberfest and Christmas-lighting festivals that pack the village in fall. A soak in the hot tub after a cold day on the slopes or the trail is the classic Leavenworth cabin evening. It is a scenic, festival-driven base that rewards booking well ahead for its busiest weekends.",
        bestAreas:
          'Cabins up Icicle Road along Icicle Creek are closest to downtown and the Enchantments trailheads, while homes toward Lake Wenatchee and along the Chumstick Highway toward Plain offer quieter, more spread-out settings a bit farther out.',
        whenToBook:
          "Leavenworth's festival calendar drives demand: the Christmas-lighting weekends from late November into December, Oktoberfest, and Stevens Pass ski weekends all sell out early, so book months ahead; spring and non-festival fall dates are easiest.",
        priceBand:
          'Expect roughly $200 to $450 a night for a two- to three-bedroom hot-tub cabin, with larger homes and prime festival and ski weekends running higher.',
        faqs: [
          {
            q: 'Where are the best hot-tub cabins near Leavenworth?',
            a: 'Many of the most scenic sit up Icicle Road along Icicle Creek, minutes from downtown and hiking, with a hot tub facing the Cascades. Others cluster toward Lake Wenatchee and along the Chumstick Highway toward Plain for a quieter, more rural feel.',
          },
          {
            q: 'Is Leavenworth worth visiting in winter for a cabin?',
            a: 'Very much. The village\'s Christmas-lighting festival, snow play, and skiing at nearby Stevens Pass make winter a peak season, and soaking in a cabin hot tub after a cold day is a classic Leavenworth evening. Book early for December weekends.',
          },
          {
            q: 'How close are Leavenworth cabins to Stevens Pass and hiking?',
            a: 'Stevens Pass is about a thirty-five-minute drive west on Highway 2 through Tumwater Canyon. For summer hiking, Icicle Road cabins are minutes from trailheads into the Alpine Lakes Wilderness and the famous Enchantments.',
          },
        ],
      },
    ],
  },
  {
    slug: 'farm-stays',
    name: 'Farm stays',
    emoji: '🌾',
    sitemapSection: 'farm-stays',
    relatedCategorySlug: 'farmhouses',
    relatedCategoryLabel: 'All farmhouse rentals',
    hub: {
      h1: 'Farm Stays: Whole-Property Farmhouse, Ranch & Vineyard Rentals',
      metaDescription:
        "Rent whole-property farm stays on VRBO — working farmhouses, ranches, and vineyard estates across 15 of America's best agritourism regions.",
      intro:
        'A farm stay swaps hotel hallways for open pasture, giving you an entire farmhouse, ranch, or vineyard cottage to yourself. From the peach orchards of the Texas Hill Country to the Thoroughbred paddocks around Lexington, these 15 regions pair genuine working agriculture with whole-home comfort. Each guide below breaks down what the area grows, where to base yourself, and when to book.',
    },
    towns: [
      {
        townSlug: 'fredericksburg',
        town: 'Fredericksburg',
        state: 'TX',
        vrboDestination: 'Fredericksburg, Texas, USA',
        metaDescription:
          'Rent a whole farmhouse or vineyard cottage near Fredericksburg on VRBO — peach orchards, Hill Country wineries, and Highway 290 at your door.',
        intro:
          "Peach stands and tasting rooms share the same back roads around Fredericksburg, the German-founded seat of Gillespie County and one of Texas' largest peach-growing areas. Rent a whole farmhouse here and you are minutes from Wine Road 290, the 45-mile stretch of U.S. Highway 290 linking more than 50 wineries between Johnson City, Hye, and town. Gillespie County orchards grow some 20 peach varieties, and places like Jenschke Orchards open their rows for pick-your-own from late spring through summer. Between vineyard visits and a stop at Enchanted Rock, a private farm stay gives you a porch to watch Hill Country sunsets and a kitchen for the tomatoes, peaches, and sausage you will haul back from Fredericksburg's markets. Spring wildflowers and the June JAMboree Peach Festival draw crowds, so book a whole-home stay early if you want acreage rather than a room in town.",
        bestAreas:
          'Base yourself along Highway 290 toward Stonewall and Hye for the densest run of wineries, or northwest of town near Enchanted Rock for quieter ranch land and darker night skies.',
        whenToBook:
          'Peach season runs mid-May into August and spring wildflowers peak in April, both busy stretches; fall brings grape harvest and mild weather, while winter is the quietest and cheapest time for a farmhouse.',
        priceBand:
          'Whole farmhouses and vineyard cottages typically run about $250 to $600 a night, with larger ranch properties and peak wine-season weekends climbing higher.',
        faqs: [
          {
            q: 'Are Fredericksburg farm stays close to the wineries?',
            a: 'Yes. Many rural rentals sit directly on or just off U.S. Highway 290, the Wine Road 290 corridor, putting Becker Vineyards, Grape Creek, and dozens of others within a short drive between Fredericksburg and Johnson City.',
          },
          {
            q: 'Can you pick your own peaches near Fredericksburg?',
            a: 'In season, yes. Gillespie County orchards such as Jenschke Orchards and the Stonewall peach stands along Highway 290 offer pick-your-own and fresh-picked peaches roughly from mid-May through early August.',
          },
          {
            q: 'Do farm stays near Fredericksburg have room for a group or wedding party?',
            a: 'Many do. The area has larger ranch houses and multi-cabin properties built for the region\'s popular wedding and bachelorette trade, so filter for higher sleep counts and confirm event rules with the host before booking.',
          },
        ],
      },
      {
        townSlug: 'lancaster',
        town: 'Lancaster County',
        state: 'PA',
        vrboDestination: 'Lancaster County, Pennsylvania, USA',
        metaDescription:
          'Stay in a whole Amish-country farmhouse near Lancaster on VRBO — working dairy land, covered bridges, and the towns of Bird-in-Hand and Strasburg.',
        intro:
          "Few places in America farm as visibly as Lancaster County, where roughly 45,000 Old Order Amish work some of the richest soil in the country and horse-drawn buggies still share the lanes. Renting a whole farmhouse here drops you among genuinely productive dairy and produce land, often within sight of the towns that define Pennsylvania Dutch Country: Bird-in-Hand, with its farmers market and buggy rides; Strasburg, home to working dairy tours and America's oldest short-line railroad; and Lititz, with its Julius Sturgis pretzel bakery and Wilbur Chocolate. The county's 950 square miles of farmland feed roadside stands, the 1730s-era Central Market in Lancaster city, and creameries like Strasburg's Down on the Farm. A private farm stay means a kitchen for market-fresh eggs and cheese, room for the kids to roam, and mornings quiet enough to hear the clop of passing buggies.",
        bestAreas:
          'The heart of Amish farm country lies east of Lancaster city around Bird-in-Hand, Intercourse, and Strasburg, while Lititz and Ephrata to the north add charming small-town bases within easy reach of the same working farms.',
        whenToBook:
          'Late spring through fall is peak farm season, with produce, corn, and tobacco fields at their fullest and fall harvest events drawing the biggest crowds; winter is quiet and well-priced.',
        priceBand:
          'Whole farmhouses generally run about $150 to $350 a night, among the more affordable farm-stay regions, with larger restored barns and event-ready properties at the top of the range.',
        faqs: [
          {
            q: 'Can you stay on a working Amish farm in Lancaster County?',
            a: 'Some rentals sit on or beside active Amish and Mennonite farms, though Old Order families themselves rarely list online. Expect neighboring dairy herds, produce fields, and buggy traffic rather than a rental inside an Old Order household.',
          },
          {
            q: "What towns should I base near for Lancaster's Amish country?",
            a: 'Bird-in-Hand, Intercourse, and Strasburg put you deepest in the farmland and closest to markets and buggy rides, while Lititz offers a walkable historic downtown a short drive north.',
          },
          {
            q: 'Are Lancaster farm stays good for families?',
            a: 'Very. The gentle farmland, petting-farm creameries like Down on the Farm in Strasburg, the Strasburg Rail Road, and short distances between attractions make it one of the easier agritourism regions to visit with young kids.',
          },
        ],
      },
      {
        townSlug: 'finger-lakes',
        town: 'Finger Lakes',
        state: 'NY',
        vrboDestination: 'Finger Lakes, New York, USA',
        metaDescription:
          'Book a whole-home farm or vineyard stay in the Finger Lakes on VRBO — Riesling country above Seneca and Cayuga lakes, near Geneva and Watkins Glen.',
        intro:
          "Eleven long, glacier-carved lakes give this part of central New York its name and its wine. Around Seneca and Cayuga, the two largest, more than a hundred wineries climb the slopes, and the region's cool climate has made Riesling its signature grape alongside Gewurztraminer and sparkling wines. A whole-home farm stay here might overlook vine rows outside Geneva at the north end of Seneca Lake, sit near the waterfalls of Watkins Glen to the south, or tuck into the orchard and dairy land that fills the ridges between lakes. Beyond grapes, the Finger Lakes grow apples, run dairy farms, and supply the farm-to-table kitchens of Ithaca. Renting an entire farmhouse or lakeside vineyard cottage gives you a base for tasting-room days, a dock for swimming, and enough kitchen space to cook with what you gather at Ithaca and Geneva farmers markets.",
        bestAreas:
          'Seneca Lake has the densest wine trail, with Geneva anchoring the north shore and Watkins Glen the south; Cayuga Lake and college-town Ithaca add lakeside farmland and a livelier food scene just to the east.',
        whenToBook:
          'Summer and the September-October grape harvest are peak, combining warm lake weather, wine festivals, and fall color; late spring is quieter, and winter draws a smaller ice-wine and cozy-cabin crowd.',
        priceBand:
          'Expect roughly $200 to $450 a night for a whole farmhouse or vineyard cottage, with lakefront properties and harvest-weekend stays commanding the most.',
        faqs: [
          {
            q: 'Which Finger Lake is best for a wine-focused farm stay?',
            a: "Seneca Lake has the largest concentration of wineries, making it the most efficient base for tasting, while Cayuga Lake's trail is a little quieter and sits closest to Ithaca's restaurants and gorges.",
          },
          {
            q: 'Are Finger Lakes farm stays near the waterfalls and state parks?',
            a: "Yes. Many rentals on the south end of Seneca Lake are minutes from Watkins Glen State Park's gorge trail, and Cayuga's rentals put you near Taughannock Falls, one of the tallest waterfalls in the Northeast.",
          },
          {
            q: 'When is grape harvest in the Finger Lakes?',
            a: 'Harvest generally runs from September into October, the busiest and most scenic stretch for vineyard stays, with tasting rooms, festivals, and fall foliage all peaking at once.',
          },
        ],
      },
      {
        townSlug: 'sonoma',
        town: 'Sonoma County',
        state: 'CA',
        vrboDestination: 'Sonoma County, California, USA',
        metaDescription:
          'Rent a whole vineyard estate or farmhouse in Sonoma County on VRBO — 19 wine AVAs around Healdsburg, plus Petaluma dairy land and Sebastopol orchards.',
        intro:
          "With more than 500 wineries spread across nineteen distinct AVAs, Sonoma County packs an enormous range of farmland into one coastal California county. Healdsburg sits at the meeting point of three of them, the Alexander, Dry Creek, and Russian River valleys, and makes a natural base for a whole-home vineyard stay. But Sonoma is more than grapes: Petaluma and the fog-cooled Petaluma Gap are dairy country, home to creameries and award-winning cheeses, while Sebastopol was apple land before the vines arrived and still hosts the Gravenstein Apple Fair. Renting an entire farmhouse or vineyard estate here means waking among working rows, driving the Sonoma County Farm Trails to buy cheese and olive oil at the source, and cooking with produce from towns that take food seriously. Whether you want Healdsburg's polish or Petaluma's rural quiet, a private stay puts the whole county's agriculture at your doorstep.",
        bestAreas:
          'Healdsburg is the premier wine base, ringed by the Dry Creek, Alexander, and Russian River valleys; for a more rural and affordable feel, look toward Petaluma\'s dairy country or the orchards and back roads around Sebastopol and Sonoma Valley.',
        whenToBook:
          'Fall crush from roughly late August through October is the marquee season and the priciest; summer is warm and busy, late spring brings green hills and fewer crowds, and winter is the quietest, wettest, and most affordable.',
        priceBand:
          'Whole farmhouses and vineyard estates typically start around $400 a night and climb well past $1,000 for larger luxury properties, reflecting Sonoma\'s status as premium wine country.',
        faqs: [
          {
            q: 'Where should I stay in Sonoma County for wine tasting?',
            a: 'Healdsburg is the top choice, sitting where the Dry Creek, Alexander, and Russian River valleys meet, so hundreds of wineries lie within a short drive. Sonoma Valley to the south is a strong second base closer to San Francisco.',
          },
          {
            q: 'Are there real working farm stays in Sonoma, not just wineries?',
            a: 'Yes. Beyond vineyards, the county has dairies, cheesemakers, and produce farms, especially around Petaluma and Sebastopol, and the Sonoma County Farm Trails network lists many farms you can visit or buy from directly.',
          },
          {
            q: 'How far is Sonoma wine country from San Francisco?',
            a: 'Most of Sonoma County is about a 60 to 90 minute drive north of San Francisco, with Petaluma and Sonoma Valley closest and Healdsburg and the northern valleys a bit farther but still an easy weekend base.',
          },
        ],
      },
      {
        townSlug: 'woodstock',
        town: 'Woodstock',
        state: 'VT',
        vrboDestination: 'Woodstock, Vermont, USA',
        metaDescription:
          'Book a whole Vermont farmhouse near Woodstock on VRBO — Windsor County dairy land, maple sugarhouses, and the historic Billings Farm & Museum.',
        intro:
          "Vermont's dairy heritage runs especially deep around Woodstock, a postcard village in Windsor County where Frederick Billings built a model Jersey farm back in 1871. That farm, now the Billings Farm & Museum, still milks its herd and partners with Vermont cheesemakers, while nearby Sugarbush Farm draws visitors up its back road for waxed cheddar and maple syrup boiled on site. Rent a whole farmhouse in these hills and you trade sightseeing for living it: wood smoke, a porch over green pasture, and roads that wind past sugarhouses and the Quechee Gorge. The surrounding land yields the classic Vermont trinity of milk, cheese, and maple, sold at farm stands and creameries throughout the Green Mountains. A private stay gives you space to spread out after a day of leaf-peeping or skiing, plus a kitchen for the cheddar and syrup you will inevitably carry home from Woodstock's farms.",
        bestAreas:
          'Woodstock village and the surrounding towns of Quechee, Barnard, and Pomfret offer the most scenic farm settings, with quiet dirt roads, covered bridges, and easy access to Billings Farm and the sugarhouses.',
        whenToBook:
          'Fall foliage from late September into mid-October is the busiest and most expensive season by far; maple sugaring in March, summer greenery, and winter ski trips to nearby Killington round out the year at lower rates.',
        priceBand:
          'Whole farmhouses generally run about $250 to $550 a night, with restored historic homes and prime foliage-week rentals pushing higher.',
        faqs: [
          {
            q: 'Can you visit a working dairy farm near Woodstock?',
            a: 'Yes. The Billings Farm & Museum just outside Woodstock village is a working Jersey dairy open to visitors, and Sugarbush Farm nearby makes cheese and maple syrup on site, both a short drive from most area farm rentals.',
          },
          {
            q: 'When can you see maple syrup being made near Woodstock?',
            a: 'Sugaring season typically falls in March into early April, when warm days and freezing nights get the sap running and local sugarhouses like Sugarbush Farm boil and sell fresh syrup.',
          },
          {
            q: 'Are Woodstock farm stays a good base for fall foliage?',
            a: 'Excellent. The Woodstock and Quechee area is one of Vermont\'s classic leaf-peeping spots, so a whole-home farm stay here puts covered bridges, sugarhouses, and the Green Mountains\' color right outside, though October books up early.',
          },
        ],
      },
      {
        townSlug: 'willamette-valley',
        town: 'Willamette Valley',
        state: 'OR',
        vrboDestination: 'Willamette Valley, Oregon, USA',
        metaDescription:
          'Rent a whole vineyard farmhouse in Oregon\'s Willamette Valley on VRBO — Pinot Noir country in the Dundee Hills near Newberg and McMinnville.',
        intro:
          "Pinot Noir made the Willamette Valley famous, and the vines that started it went into the Dundee Hills in the mid-1960s. Today more than 700 wineries fill this broad Oregon valley that runs 150 miles from Portland south toward Eugene, with the wine towns of Newberg, Dundee, and McMinnville clustered at its northern end. A whole-home farm stay here sits among more than grapes, though: the valley is Oregon's agricultural core, growing nearly all of the country's hazelnuts along with hops, berries, and lavender. Rent an entire farmhouse or vineyard cottage and you can spend mornings walking the rows, afternoons on the tasting-room circuit around Dundee, and evenings cooking with hazelnuts and marionberries from a nearby stand. The valley's damp, mild climate keeps the hills green much of the year, and a private stay gives you the space and kitchen that tasting-room hopping alone cannot.",
        bestAreas:
          'The northern Willamette around Newberg, Dundee, and McMinnville holds the greatest concentration of wineries and the Dundee Hills AVA, while the Eola-Amity Hills near Salem and the countryside toward Carlton offer quieter vineyard settings.',
        whenToBook:
          'Summer and the September-October harvest are peak, with warm, dry weather and crush activity; spring and its wildflowers are quieter, and the wet winter is the low season with the best farmhouse rates.',
        priceBand:
          'Whole vineyard farmhouses typically run about $300 to $700 a night, with larger estate homes and harvest-season weekends reaching higher.',
        faqs: [
          {
            q: 'Which town is the best base for Willamette Valley wineries?',
            a: 'Newberg and Dundee sit in the middle of the densest wine country and the Dundee Hills, while McMinnville offers a lively historic downtown with restaurants and lodging, all within easy reach of hundreds of tasting rooms.',
          },
          {
            q: 'What does the Willamette Valley grow besides wine grapes?',
            a: "The valley produces close to all of the United States' hazelnuts, plus hops for craft beer, berries such as marionberries and blueberries, Christmas trees, and lavender, making for a genuinely diverse farm landscape.",
          },
          {
            q: 'How far is the Willamette Valley wine country from Portland?',
            a: 'The northern wine towns of Newberg and Dundee are roughly a 40 to 60 minute drive southwest of Portland, making the valley an easy weekend base or even a long day trip from the city.',
          },
        ],
      },
      {
        townSlug: 'shenandoah',
        town: 'Shenandoah Valley',
        state: 'VA',
        vrboDestination: 'Shenandoah Valley, Virginia, USA',
        metaDescription:
          'Book a whole-home farm stay in Virginia\'s Shenandoah Valley on VRBO — apple orchards and cattle land between Staunton, Harrisonburg, and the Blue Ridge.',
        intro:
          "Tucked between the Blue Ridge and Allegheny mountains, the Shenandoah Valley is one of Virginia's true agricultural strongholds, home to several of the state's top farming counties. This is apple country first, growing much of Virginia's crop, but the valley also runs on poultry, cattle, and dairy, with newer vineyards and cideries filling in the gaps. A whole-home farm stay here might sit outside Staunton, near the university town of Harrisonburg, or toward Luray and its famous caverns, all within reach of Skyline Drive and Shenandoah National Park. Renting an entire farmhouse gives you a porch facing the ridgelines, room for the family, and a kitchen for the apples, beef, and cheese you will find at spots like the Dayton Market southwest of Harrisonburg. It is a quieter, more affordable corner of American farm country, long on scenery and short on crowds.",
        bestAreas:
          'Staunton and Harrisonburg anchor the central valley with the most farms, markets, and restaurants nearby, while the Luray and Front Royal end sits closest to Skyline Drive and the northern reaches of Shenandoah National Park.',
        whenToBook:
          'Fall is the standout season, combining apple harvest, cider, and Blue Ridge foliage; spring blossoms and warm summers are pleasant and less crowded, and winter offers the lowest rates in this budget-friendly region.',
        priceBand:
          'Whole farmhouses here are a relative bargain at roughly $150 to $375 a night, with larger estates and prime foliage weekends toward the upper end.',
        faqs: [
          {
            q: 'Where can you pick apples in the Shenandoah Valley?',
            a: "The valley grows much of Virginia's apple crop, and orchards near Staunton, Harrisonburg, and up toward Winchester offer pick-your-own in late summer and fall, alongside farm markets selling cider and fresh-pressed juice.",
          },
          {
            q: 'Are Shenandoah Valley farm stays close to Shenandoah National Park?',
            a: 'Yes. Much of the valley sits within a short drive of a Skyline Drive entrance, with the Luray, Front Royal, and Waynesboro areas putting the park and its overlooks closest to your farmhouse.',
          },
          {
            q: 'Is the Shenandoah Valley cheaper than other wine and farm regions?',
            a: 'Generally, yes. Compared with Sonoma, Napa, or even nearby Charlottesville, Shenandoah Valley farmhouse rentals tend to be noticeably more affordable, which makes it a popular budget-friendly choice for families and groups.',
          },
        ],
      },
      {
        townSlug: 'door-county',
        town: 'Door County',
        state: 'WI',
        vrboDestination: 'Door County, Wisconsin, USA',
        metaDescription:
          'Rent a whole farmhouse or orchard cottage in Door County on VRBO — Wisconsin\'s cherry peninsula from Sturgeon Bay to Egg Harbor and Sister Bay.',
        intro:
          "This narrow peninsula reaching into Lake Michigan is Wisconsin's cherry country, nicknamed Cherryland USA for good reason. Door County grows about 95 percent of the state's tart cherries across more than 2,000 acres of orchards, most of them the ruby-red Montmorency variety first planted here in 1858. The lake moderates the climate just enough for fruit to thrive, and orchards like Seaquist in Sister Bay and Lautenbach's Orchard Country in Fish Creek open their rows for picking each July. Rent a whole farmhouse or orchard cottage and you can string together the peninsula's waterfront villages, Sturgeon Bay, Egg Harbor, Fish Creek, and Ephraim, between farm-market stops for cherry pie, jam, and hard cider. Beyond cherries the county grows apples and runs dairy farms, and a private stay gives you a full kitchen and a base for beaches, lighthouses, and the fish boils Door County is known for.",
        bestAreas:
          'The bay-side villages of Egg Harbor, Fish Creek, and Sister Bay put you closest to the orchards, farm markets, and Peninsula State Park, while Sturgeon Bay at the peninsula\'s base is the largest town and often the best value.',
        whenToBook:
          'Summer is peak, and cherry-picking season in mid-to-late July is the marquee moment; fall foliage and the apple harvest are a lovely quieter alternative, while many properties slow down or close in deep winter.',
        priceBand:
          'Whole farmhouses and cottages generally run about $250 to $550 a night in summer, with waterfront homes higher and shoulder-season rates noticeably softer.',
        faqs: [
          {
            q: 'When is cherry-picking season in Door County?',
            a: "Tart Montmorency cherries usually ripen in mid-to-late July and stay pickable for roughly three weeks, when orchards like Seaquist in Sister Bay and Lautenbach's in Fish Creek open for u-pick and sell fresh fruit and pies.",
          },
          {
            q: 'Which Door County town should I base in?',
            a: 'For orchards and walkable villages, Egg Harbor, Fish Creek, and Sister Bay on the bay side are favorites; Sturgeon Bay at the base of the peninsula is larger, more affordable, and an easy drive to everything.',
          },
          {
            q: 'Is Door County only worth visiting in summer?',
            a: 'Summer is busiest, but fall brings apple harvest and foliage, and the peninsula stays scenic year-round. Just note that some orchards, restaurants, and rentals reduce hours or close in the coldest winter months.',
          },
        ],
      },
      {
        townSlug: 'hudson-valley',
        town: 'Hudson Valley',
        state: 'NY',
        vrboDestination: 'Hudson Valley, New York, USA',
        metaDescription:
          'Book a whole-home farm stay in the Hudson Valley on VRBO — apple orchards and farm-to-table country near Rhinebeck, Hudson, and Kingston.',
        intro:
          "Two hours up the river from Manhattan, the Hudson Valley has become one of the Northeast's great farm-to-table landscapes without losing its working-farm roots. Dutchess and Ulster counties alone count more than a thousand small farms, many of them century-old apple orchards where families still open the rows for pick-your-own each fall. A whole-home farm stay here might sit outside Rhinebeck, near the antique shops and restaurants of Hudson, or across the river toward Kingston and New Paltz. Orchards such as Cedar Heights near Rhinebeck and Mead in Tivoli have grown fruit for generations, and the valley's farm stands, cideries, and CSAs supply some of the region's best kitchens. Renting an entire farmhouse gives you a weekend base close to the city yet firmly in the country, with orchards, the Catskills, and the Hudson itself all within an easy drive.",
        bestAreas:
          'The east bank around Rhinebeck, Tivoli, and Hudson is prime orchard and dining country, while the west bank toward New Paltz and Kingston sits closer to the Catskills, the Shawangunk cliffs, and Ulster County\'s farms.',
        whenToBook:
          'Fall is the signature season, with apple and pumpkin picking, cider, and foliage drawing weekend crowds from the city; late spring and summer are greener and calmer, and winter is the quiet, low-rate stretch.',
        priceBand:
          'Whole farmhouses typically run about $300 to $700 a night given the region\'s popularity with New Yorkers, with design-forward and larger properties climbing well beyond that on peak weekends.',
        faqs: [
          {
            q: 'Where is the best apple picking in the Hudson Valley?',
            a: 'Both sides of the river have historic orchards: Cedar Heights near Rhinebeck and Mead Orchards in Tivoli on the east bank, and a cluster of pick-your-own farms around New Paltz and Highland on the west bank, all busiest in September and October.',
          },
          {
            q: 'How far is the Hudson Valley from New York City?',
            a: 'Depending on the town, the mid-Hudson Valley is roughly a 90-minute to two-hour drive north of Manhattan, and Metro-North and Amtrak trains reach towns like Rhinebeck and Hudson, making a car-free farm weekend feasible.',
          },
          {
            q: 'Are Hudson Valley farm stays good for a foodie weekend?',
            a: 'Very much so. The valley is a farm-to-table hub, with celebrated restaurants, cideries, breweries, and farm stands around Hudson, Rhinebeck, and Kingston, so a whole-home rental with a good kitchen fits the trip well.',
          },
        ],
      },
      {
        townSlug: 'paso-robles',
        town: 'Paso Robles',
        state: 'CA',
        vrboDestination: 'Paso Robles, California, USA',
        metaDescription:
          'Rent a whole vineyard ranch near Paso Robles on VRBO — Central Coast Zinfandel and Rhone country with olive groves around Templeton and Adelaida.',
        intro:
          "The name means 'pass of the oaks,' and gnarled oaks still shade the rolling hills where Paso Robles grew into one of California's most exciting wine regions. Zinfandel has the deepest roots here, with heritage vines dating to the 1850s, though Cabernet Sauvignon and Rhone grapes like Syrah now fill much of the 40,000 vineyard acres spread across eleven sub-AVAs. A whole-home farm stay puts you among those rows, perhaps out toward the hilly Adelaida District west of town or down around Templeton and its cooler gap. Long before the vines, this was almond and olive country, and olive groves still dot the ranches alongside the vineyards. Renting an entire ranch house or vineyard cottage means dark skies, hot-springs history, and a kitchen for the olive oil, almonds, and wine you will gather across San Luis Obispo County's inland hills.",
        bestAreas:
          'West of Highway 101, the Adelaida, Willow Creek, and Templeton Gap districts hold the hilliest, most scenic vineyards and cooler air, while the east side around the Geneseo and El Pomar districts offers flatter, often more affordable ranch settings.',
        whenToBook:
          'Harvest from roughly August through October is the peak and most atmospheric season; spring green and summer warmth are popular too, while winter is the quiet, lowest-priced time in the region\'s rolling hills.',
        priceBand:
          'Whole vineyard ranches and farmhouses typically run about $300 to $700 a night, with larger estate properties and harvest weekends reaching higher.',
        faqs: [
          {
            q: 'What wine is Paso Robles known for?',
            a: 'Paso Robles is best known for bold reds, especially Zinfandel from heritage vines and Rhone varieties like Syrah and Grenache, along with Cabernet Sauvignon, which is now the most widely planted grape in the region.',
          },
          {
            q: 'Is Paso Robles more affordable than Napa or Sonoma?',
            a: 'Generally, yes. Paso Robles is known as a more relaxed, better-value Central Coast alternative to Napa and Sonoma, and whole-home vineyard rentals here often cost less than comparable properties in the northern wine counties.',
          },
          {
            q: 'What else grows around Paso Robles besides grapes?',
            a: 'The area has deep roots in almonds and olives, once earning the nickname Almond City, and olive groves and olive-oil producers still operate among the vineyards, along with cattle ranches on the outlying hills.',
          },
        ],
      },
      {
        townSlug: 'lexington',
        town: 'Lexington',
        state: 'KY',
        vrboDestination: 'Lexington, Kentucky, USA',
        metaDescription:
          'Book a whole-home horse-farm stay near Lexington on VRBO — Bluegrass country of Thoroughbred farms, Keeneland, and Woodford County bourbon.',
        intro:
          "They call Lexington the Horse Capital of the World, and one drive past the black plank fences of the Bluegrass explains why. More than 450 horse farms surround the city, raising the Thoroughbred foals that fill Keeneland's sales ring and the region's racetracks, all of it nourished by the limestone-rich soils that grow Kentucky's famous bluegrass. A whole-home farm stay here sets you among those paddocks, perhaps out toward Woodford County and the horse-and-bourbon towns of Midway and Versailles, along scenic lanes like Old Frankfort Pike. This is working farm country layered with distilleries, so a rental can pair a morning visit to a breeding farm with an afternoon on the bourbon trail. Renting an entire farmhouse gives you room to spread out, a porch over the pastures, and an easy base for Keeneland, horse-farm tours, and the rolling green heart of central Kentucky.",
        bestAreas:
          'The horse country northwest and west of Lexington, through Woodford County toward Midway and Versailles and along Old Frankfort Pike, has the most scenic farms; the Georgetown and Paris areas to the north hold more of the same rolling Bluegrass paddocks.',
        whenToBook:
          "Spring and fall are peak, timed to Keeneland's April and October race meets and mild weather; summer is warm and green, and winter is quiet with the best rates, though foal-watching is best in late winter and early spring.",
        priceBand:
          'Whole farmhouses generally run about $200 to $450 a night, with larger estate homes and Keeneland race-week weekends commanding a premium.',
        faqs: [
          {
            q: 'Can you stay on a working horse farm near Lexington?',
            a: 'Yes. Some Bluegrass rentals sit on or beside active Thoroughbred farms, letting you wake to horses in the paddocks, though most working breeding operations limit access, so book a listing that specifically offers farm lodging.',
          },
          {
            q: 'Is a Lexington farm stay close to the bourbon trail?',
            a: 'Very. Woodford County, just west of Lexington around Versailles and Midway, is home to distilleries like Woodford Reserve, so many horse-country rentals put both breeding farms and bourbon stops within a short drive.',
          },
          {
            q: 'When should I visit Lexington horse country?',
            a: 'Spring and fall are ideal, aligning with Keeneland\'s marquee April and October race meets, peak greenery, and comfortable weather, though foal-watching is best in late winter and early spring when the new crop arrives.',
          },
        ],
      },
      {
        townSlug: 'franklin',
        town: 'Franklin',
        state: 'TN',
        vrboDestination: 'Franklin, Tennessee, USA',
        metaDescription:
          'Rent a whole-home farm stay near Franklin, TN on VRBO — Williamson County horse farms and rolling hills around Leiper\'s Fork, minutes from Nashville.',
        intro:
          "Just south of Nashville, Franklin trades the city's honky-tonks for the rolling pastures and horse farms of Williamson County, some of the prettiest countryside in Middle Tennessee. The village of Leiper's Fork sums up the area's character, a small community of farmers, artists, and musicians surrounded by cattle and horse land, with a handful of shops and restaurants at its center. A whole-home farm stay here drops you into that landscape of hardwood ridges, creek bottoms, and grazing paddocks, yet keeps you a short drive from Franklin's historic Main Street and downtown Nashville. The county's farms raise horses and cattle across gently rolling hills, and a private rental gives you a porch over the fields, room for a group, and a base for wineries, distilleries, and the live music the region is famous for. It is Southern farm country with Nashville next door.",
        bestAreas:
          "Leiper's Fork and the countryside west and south of downtown Franklin hold the classic horse-farm scenery, while staying closer to Franklin's historic Main Street or nearby College Grove keeps you near restaurants and an easy run into Nashville.",
        whenToBook:
          'Spring and fall bring the mildest weather and the greenest or most colorful hills and are the most popular times; summer is warm and lively with festival season, and winter is quieter with lower rates.',
        priceBand:
          'Whole farmhouses typically run about $250 to $550 a night, with larger estates, properties closest to Franklin or Nashville, and big-event weekends reaching higher.',
        faqs: [
          {
            q: 'How far is Franklin from Nashville?',
            a: 'Downtown Franklin sits roughly 20 miles, or about a 30-minute drive, south of downtown Nashville, so a Williamson County farm stay offers rural quiet while keeping the city\'s music and airport within easy reach.',
          },
          {
            q: "What is Leiper's Fork known for?",
            a: "Leiper's Fork is a small, artsy farm village west of Franklin, known for its horse and cattle farms, galleries, a general store, and a low-key live-music scene that has drawn well-known Nashville musicians to the area.",
          },
          {
            q: 'Are Franklin farm stays good for groups or family reunions?',
            a: 'Yes. Williamson County has a number of larger farmhouses and estates on acreage that suit reunions, bachelorette trips, and songwriter retreats, offering space and privacy while staying close to Franklin and Nashville.',
          },
        ],
      },
      {
        townSlug: 'bozeman',
        town: 'Bozeman',
        state: 'MT',
        vrboDestination: 'Bozeman, Montana, USA',
        metaDescription:
          'Book a whole-home ranch stay near Bozeman on VRBO — Gallatin Valley cattle ranches and wheat country framed by mountains, near Big Sky and Yellowstone.',
        intro:
          "Ringed by mountains, the Gallatin Valley around Bozeman was once territorial Montana's breadbasket, and it still grows wheat, barley, and hay across its wide, irrigated floor. Cattle ranches spread through the rolling ground between Bozeman, Belgrade, and Four Corners, running Angus and Hereford herds on grass beneath the Bridger and Gallatin ranges. A whole-home ranch stay here means big skies, working agriculture, and quick access to some of the West's best-known landscapes: the blue-ribbon Gallatin River, the ski slopes of Big Sky, and the northern gateways to Yellowstone. Renting an entire ranch house or farmhouse gives you space to spread out after a day of fly-fishing, hiking, or driving the valley, plus a kitchen for Montana beef and the produce of Bozeman's farmers market. This is Northern Rockies farm and ranch country, where the fields end where the mountains begin.",
        bestAreas:
          'The valley floor around Belgrade, Manhattan, and Four Corners holds the most working farm and ranch land, while settings toward the Bridger foothills or south along the Gallatin River trade cropland for mountain views and river access.',
        whenToBook:
          'Summer is peak, with long days for fishing, hiking, and Yellowstone trips, and it books early; fall brings harvest and hunting season, winter draws Big Sky skiers, and late spring is the quiet shoulder with better rates.',
        priceBand:
          'Whole ranch houses and farmhouses typically run about $300 to $800 a night, with larger properties and prime summer and ski-season dates climbing higher near Big Sky.',
        faqs: [
          {
            q: 'How far is Bozeman from Yellowstone National Park?',
            a: 'Bozeman is one of Yellowstone\'s northern gateway towns, roughly a 90-minute drive to the north entrance at Gardiner via Paradise Valley, making a Gallatin Valley ranch stay a comfortable base for day trips into the park.',
          },
          {
            q: 'What do farms and ranches around Bozeman raise?',
            a: 'The Gallatin Valley grows wheat, barley, hay, and other crops on its irrigated ground and runs cattle, especially Angus and Hereford, on the surrounding rangeland, a mix dating back to Bozeman\'s days as Montana\'s grain breadbasket.',
          },
          {
            q: 'Is a Bozeman ranch stay good for fly-fishing?',
            a: 'Excellent. The Gallatin River runs right through the valley, and the Madison, Yellowstone, and other blue-ribbon trout waters are close by, so many ranch rentals put you within easy reach of world-class fly-fishing.',
          },
        ],
      },
      {
        townSlug: 'north-georgia',
        town: 'North Georgia',
        state: 'GA',
        vrboDestination: 'Ellijay, Georgia, USA',
        metaDescription:
          'Rent a whole mountain farmhouse in North Georgia on VRBO — apple country around Ellijay and Blue Ridge, with Dahlonega vineyards nearby.',
        intro:
          "Come autumn, the mountains around Ellijay fill with the smell of apples and cider doughnuts. Gilmer County, with Ellijay at its center, is the Apple Capital of Georgia, and orchards like B.J. Reece, R&A, and Red Apple Barn have grown fruit on these Blue Ridge slopes for generations, harvesting more than 20 varieties from late summer into November. Nearby Blue Ridge adds Mercier Orchards, the state's largest, while Dahlonega to the southeast has become the hub of Georgia wine country. A whole-home farm stay here means a cabin or farmhouse tucked into the mountains, minutes from u-pick rows, roadside markets, and the trout streams and trailheads of the Chattahoochee National Forest. Renting an entire property gives you a porch over the ridgelines, a fireplace for cool mountain nights, and a kitchen for all the apples, cider, and mountain honey you will inevitably carry home.",
        bestAreas:
          'Ellijay and East Ellijay sit at the center of the apple orchards, the town of Blue Ridge to the north adds Mercier Orchards and a lively main street, and Dahlonega to the southeast anchors the wineries, all within the Blue Ridge Mountains.',
        whenToBook:
          'Fall is by far the peak, when apple harvest, the Georgia Apple Festival in Ellijay, and mountain foliage draw big crowds and higher rates; spring and summer are greener, quieter, and better value.',
        priceBand:
          'Whole cabins and farmhouses typically run about $175 to $400 a night, with larger mountain lodges and leaf-season October weekends reaching higher.',
        faqs: [
          {
            q: 'When is apple season in North Georgia?',
            a: 'Apple season around Ellijay runs from about late August into November, peaking in September and October, when Gilmer County orchards such as B.J. Reece and R&A open for pick-your-own and sell cider, fried pies, and fresh-pressed juice.',
          },
          {
            q: 'Are there wineries near the North Georgia apple orchards?',
            a: 'Yes. Dahlonega, southeast of Ellijay, is the heart of Georgia wine country with numerous vineyards, and Ellijay itself has wineries like Engelheim, so a farm stay can easily combine apple orchards and tasting rooms.',
          },
          {
            q: 'What is there to do besides apple picking in North Georgia?',
            a: 'Plenty. The Blue Ridge Mountains around Ellijay and Blue Ridge offer hiking and waterfalls in the Chattahoochee National Forest, trout fishing, the Blue Ridge Scenic Railway, and mountain-town shopping, making it a well-rounded outdoor base.',
          },
        ],
      },
      {
        townSlug: 'sedona',
        town: 'Sedona',
        state: 'AZ',
        vrboDestination: 'Sedona, Arizona, USA',
        metaDescription:
          'Book a whole-home stay near Sedona on VRBO — Verde Valley wine country of Page Springs and Cornville, with vineyards and ranches along Oak Creek.',
        intro:
          "Beneath Sedona's red rock spires, the Verde Valley has quietly grown into Arizona's most surprising wine country. Fed by Oak Creek and the Verde River, this high-desert basin has been ranch and farm land since pioneer days, and in recent decades vineyards have taken to its craggy hillsides. Just south of Sedona, the neighboring communities of Page Springs and Cornville hold a cluster of pioneering wineries, Page Springs Cellars, Oak Creek Vineyards, Javelina Leap, and the historic D.A. Ranch among them, pouring Syrah, Sangiovese, and other warm-climate reds. A whole-home stay here lets you pair red-rock hiking above Sedona with tasting-room afternoons along North Page Springs Road, where green pastures and olive and fruit orchards line the creek. Renting an entire house or casita gives you a patio under the desert stars and a base for both Sedona's trails and the valley's vineyards and ranches.",
        bestAreas:
          'Sedona itself offers the red-rock scenery and trailheads, while the wine hamlets of Page Springs and Cornville along Oak Creek, about 20 minutes south, put you closest to the vineyards, ranches, and tasting rooms of the Verde Valley.',
        whenToBook:
          'Spring and fall bring the most comfortable weather and are peak for both hiking and the grape harvest; summer is hot but quieter in the valley, and mild winters make Sedona a year-round destination with softer off-season rates.',
        priceBand:
          'Whole homes and casitas near Sedona typically run about $350 to $900 a night given the area\'s popularity, with larger luxury properties and prime red-rock views higher still.',
        faqs: [
          {
            q: 'Is there really wine country near Sedona?',
            a: 'Yes. The Verde Valley just south of Sedona, especially Page Springs and Cornville along Oak Creek, has a growing cluster of wineries such as Page Springs Cellars and Oak Creek Vineyards, producing warm-climate reds like Syrah and Sangiovese.',
          },
          {
            q: 'How far are the Verde Valley vineyards from Sedona?',
            a: 'The Page Springs and Cornville wineries sit roughly 20 to 30 minutes south of Sedona by car, close enough to combine red-rock hiking in the morning with vineyard tasting rooms in the afternoon from a single home base.',
          },
          {
            q: 'What is the best time of year for a Sedona-area farm and wine stay?',
            a: 'Spring and fall offer the most pleasant weather for hiking and coincide with the grape-growing and harvest seasons, while Sedona\'s mild winters keep it appealing year-round; midsummer is hot but the least crowded in the valley.',
          },
        ],
      },
    ],
  },
  {
    slug: 'reunion-villas',
    name: 'Reunion villas',
    emoji: '🏡',
    sitemapSection: 'reunion-villas',
    relatedCategorySlug: 'mansions',
    relatedCategoryLabel: 'Large group mansions',
    hub: {
      h1: 'Reunion Villas: Whole-Home Rentals for Family Reunions and Large Groups',
      metaDescription:
        'Compare VRBO reunion villas that sleep 12-20+ under one roof - big-group whole-home rentals with private pools and full kitchens in 15 top US destinations.',
      intro:
        "A reunion villa is a single large whole-home rental - typically 6 to 15 bedrooms sleeping 12 to 20-plus - booked so an entire family or friend group shares one address, one kitchen, and one pool instead of scattering across hotel rooms. On VRBO these big homes almost always cost less per person than an equivalent block of hotel rooms, and they turn the lodging itself into the gathering place. This guide breaks down where to find them across 15 of the best US reunion destinations, from Orlando's golf-resort estates to Corolla's 20-bedroom oceanfront event homes.",
    },
    towns: [
      {
        townSlug: 'orlando',
        town: 'Orlando',
        state: 'FL',
        vrboDestination: 'Orlando, Florida, USA',
        metaDescription:
          "VRBO whole-home villas near Orlando's theme parks that sleep 12-20 - Reunion Resort estates with private pools, one kitchen, room for the whole group.",
        intro:
          "Reunion Resort and Encore Resort at Reunion have made Orlando the default landing spot for extended families who want Disney by day and everyone under one roof by night. These gated golf communities rent private estates that climb to 13, 14, even 15 bedrooms, so three generations can split the cost of a single home with its own pool, spa, and full kitchen instead of booking six hotel rooms. Groups chasing value over square footage lean toward ChampionsGate and Windsor at Westside, where nine-bedroom pool homes sit minutes from the Walt Disney World gates. The math is what sells it: a 16-person villa with a screened pool, game room, and two dishwashers often costs less per head than adjoining resort rooms, and nobody has to caravan between hotels. For reunions built around theme-park mornings and grill-out evenings, Orlando's villa communities are hard to beat.",
        bestAreas:
          'Reunion Resort and Encore Resort at Reunion for the largest estates, with ChampionsGate and Windsor at Westside for value pool homes closest to the Disney gates.',
        whenToBook:
          'Demand runs year-round; book 6 to 12 months out for spring break, summer, and the Thanksgiving-to-Christmas holidays, when the biggest Reunion and Encore estates go first.',
        priceBand:
          'Large pool homes generally run about $650 to $3,000 per night, with 12-to-15-bedroom Reunion and Encore estates at the top of that range.',
        faqs: [
          {
            q: 'How many people can a Reunion Resort villa near Orlando sleep?',
            a: 'Reunion Resort rents homes from three bedrooms up to roughly 15-bedroom estates, with the largest sleeping about 20 to 30 guests. Encore Resort at Reunion tops out near 13 bedrooms and 20-plus guests, so a full reunion can share one house with a private pool and full kitchen.',
          },
          {
            q: "How far are Orlando's large villa communities from Walt Disney World?",
            a: 'Most large-group communities sit 10 to 20 minutes from the Disney gates. ChampionsGate and Windsor at Westside are among the closest, while Reunion and Encore are a short drive off I-4, making park mornings and midday pool breaks easy for big groups.',
          },
          {
            q: 'Is renting one big villa cheaper than hotel rooms for an Orlando reunion?',
            a: 'Usually, yes. A 16-guest villa with a screened pool, game room, and kitchen often costs less per person than booking five or six on-property hotel rooms, and you save again by cooking some meals at the house instead of eating out in the parks every day.',
          },
        ],
      },
      {
        townSlug: 'kissimmee',
        town: 'Kissimmee',
        state: 'FL',
        vrboDestination: 'Kissimmee, Florida, USA',
        metaDescription:
          'VRBO whole-home rentals in Kissimmee for groups of 12-20 - Solara and Storey Lake pool villas minutes from Disney, at lower rates than Orlando.',
        intro:
          "Value is the whole pitch in Kissimmee, where mega-amenity resorts sit even closer to the parks than most of Orlando proper. Solara Resort spreads pool villas across an 18-acre amenity campus with a FlowRider surf simulator, and Storey Lake rents themed homes whose kids' bedrooms nod to nearby park characters - both put you within a handful of miles of Walt Disney World. For a reunion of 16 to 20, a single eight- or nine-bedroom home at Windsor Island Resort or Storey Lake comes with its own screened pool, a kitchen sized for buffet breakfasts, and a garage-turned-game-room, all for a nightly rate that undercuts comparable Orlando estates. Margaritaville Resort Orlando adds a walkable entertainment district for groups who want dinner and mini-golf without driving. Families reunite here because the price per person drops without giving up the private pool or the short park commute.",
        bestAreas:
          'Solara Resort, Storey Lake, and Windsor Island Resort lead for big pool homes, with Margaritaville Resort Orlando adding a walkable entertainment district.',
        whenToBook:
          'The same park-driven calendar applies - summer, spring break, and the winter holidays fill first, so reserve 6 to 9 months ahead for peak weeks.',
        priceBand:
          'Expect roughly $450 to $1,800 per night for an eight- or nine-bedroom pool home, generally undercutting comparable Orlando estates.',
        faqs: [
          {
            q: 'Which Kissimmee resorts are best for a large family reunion?',
            a: 'Solara Resort, Storey Lake, and Windsor Island Resort are the go-to communities for big groups. They rent eight- and nine-bedroom pool homes and back them with resort amenities like lazy rivers, a FlowRider surf simulator at Solara, and clubhouses, all within a few miles of Walt Disney World.',
          },
          {
            q: 'How close is Kissimmee to the Orlando theme parks?',
            a: 'Very close - many Kissimmee resorts sit four to seven miles from Walt Disney World and a short drive from Universal and SeaWorld. Storey Lake, for example, is roughly four miles from Disney, so large groups get park proximity at lower nightly rates than Orlando proper.',
          },
          {
            q: 'Do Kissimmee vacation homes have private pools for groups?',
            a: 'Most large Kissimmee rentals include a private screened pool, and many add a spa and a converted-garage game room. Resorts like Solara and Storey Lake also offer shared water parks and lazy rivers, so a reunion has both a private pool at the house and big communal amenities.',
          },
        ],
      },
      {
        townSlug: 'scottsdale',
        town: 'Scottsdale',
        state: 'AZ',
        vrboDestination: 'Scottsdale, Arizona, USA',
        metaDescription:
          'VRBO whole-home rentals in Scottsdale for large groups and bachelorettes - North Scottsdale estates with private pools that sleep 12-20+.',
        intro:
          "Bachelorette crews and milestone-birthday groups have turned Scottsdale into the Southwest's party-house capital, and the inventory has followed. Around Old Town Scottsdale you can walk to nightlife from a rental, while North Scottsdale delivers the sprawling desert estates - some sleeping 20 to 30 across seven to eleven bedrooms - with resort pools, pickleball courts, golf simulators, and the occasional swim-up bar. The draw shifts by season: near-perfect winter and spring weather, Cactus League spring training in March, championship golf at Troon North and TPC Scottsdale, and a spa scene built for group pampering. One estate with a heated pool and a misted patio keeps everyone together from the morning tee time to the late-night hot tub, and splitting a $2,000 house fifteen ways still beats fifteen resort rooms. For a group that wants sun, a private pool, and a short ride to the bars, Scottsdale is close to purpose-built.",
        bestAreas:
          'Old Town Scottsdale for walkable nightlife, and North Scottsdale for larger, more private estates with resort pools and sport courts.',
        whenToBook:
          'January through April is peak for weather, spring training, and bachelorettes - book 6-plus months ahead; summer heat brings the steepest discounts.',
        priceBand:
          'Group estates typically run about $700 to $4,000-plus per night, peaking in the winter and spring high season.',
        faqs: [
          {
            q: 'Where should a bachelorette group stay in Scottsdale?',
            a: 'Old Town Scottsdale is the top pick for walkability to bars and restaurants, while North Scottsdale offers larger, more private estates with resort pools. Many bachelorette houses sleep 12 to 20-plus and come with heated pools, so groups can pre-game at the house before heading to Old Town.',
          },
          {
            q: 'When is the most expensive time to rent a large Scottsdale house?',
            a: 'January through April is peak, thanks to ideal weather, Cactus League spring training, and bachelorette season, and rates run highest then. Summer is far cheaper because of the heat, so budget-focused groups who do not mind 100-plus-degree days can score big pool homes for less.',
          },
          {
            q: 'Do large Scottsdale rentals have private pools?',
            a: 'Almost all of them - a private, often heated pool is standard for group homes here, and higher-end estates add pickleball courts, golf simulators, misted patios, and swim-up bars. With Scottsdale summers so hot, the pool is the center of nearly every group stay.',
          },
        ],
      },
      {
        townSlug: 'destin',
        town: 'Destin',
        state: 'FL',
        vrboDestination: 'Destin, Florida, USA',
        metaDescription:
          'VRBO whole-home beach rentals in Destin for groups of 12-20 - Gulf-front homes in Crystal Beach and Destin Pointe with private pools.',
        intro:
          "Sugar-white sand and the Gulf's improbable green water are why reunions keep choosing Destin over pricier stretches of the Panhandle. The gated enclave of Destiny West and the beachfront homes of Crystal Beach and Destin Pointe rent Gulf-front houses that sleep 16 to well over 30, many tossing in a private pool, an elevator, and a golf cart for the run to the sand. Just east, Miramar Beach and the Sandestin Golf and Beach Resort corridor add ten-bedroom estates for the biggest gatherings. Groups come for the beach first but stay busy with the deep-sea charter fleet at HarborWalk Village, the outlet shopping, and calm surf that suits grandparents and toddlers alike. Put a dozen-plus relatives in one house with a stocked kitchen and a pool deck, and the daily rhythm sorts itself out - beach mornings, nap-time afternoons, big shared dinners. That is the Destin reunion formula.",
        bestAreas:
          'Crystal Beach, the gated Destiny West, and Destin Pointe for Gulf-front homes, with Miramar Beach holding some of the largest estates.',
        whenToBook:
          'June through August is peak and July 4 week goes first; book large summer homes by winter, or target May and September for lower rates.',
        priceBand:
          'Large Gulf-front homes generally run about $700 to $3,500 per night in summer, with the biggest estates higher.',
        faqs: [
          {
            q: 'What is the best area in Destin for a large group beach house?',
            a: 'Crystal Beach, the gated Destiny West community, and Destin Pointe are prime for big Gulf-front homes, while neighboring Miramar Beach has some of the largest estates sleeping 20 to 40. All put you on the sugar-white sand with a private pool and room for the whole reunion.',
          },
          {
            q: 'When is peak season for Destin group rentals?',
            a: 'June through August is the busiest and priciest stretch, with July 4 week going first. Large Gulf-front homes for summer are best booked by winter; groups wanting lower rates and calm surf often choose May or September shoulder weeks.',
          },
          {
            q: 'Do large Destin rentals come with a private pool and golf cart?',
            a: 'Many do - big Destin and Miramar Beach homes frequently include a private pool, and beach-block houses often throw in a golf cart to shuttle a large group and gear to the sand. Gulf-front estates typically add elevators to move luggage between floors.',
          },
        ],
      },
      {
        townSlug: '30a',
        town: '30A',
        state: 'FL',
        vrboDestination: '30A, Florida, USA',
        metaDescription:
          'VRBO whole-home rentals on 30A for large groups - walkable Seaside, Rosemary Beach and Alys Beach homes that sleep 16-plus, with carriage houses.',
        intro:
          "Along Scenic Highway 30A, a string of New Urbanist beach towns gives large groups a more designed, walkable alternative to a standard beach rental. Seaside and WaterColor anchor the family-friendly middle of the corridor; Rosemary Beach and Alys Beach bring the polished, white-stucco luxury at the eastern end. Big homes here are built for togetherness - six to eight bedrooms plus a detached carriage house, rooftop decks for sunset, bikes in the garage, and access to community pools steps from the door. Because the towns are so pedestrian, a reunion can park the cars for a week and pedal to coffee, the beach, and dinner. Expect to pay a premium: these rank among the Gulf's priciest rentals, and the marquee homes in Rosemary and Alys book close to a year out. What you get is a whole extended family within a few blocks of one another, on one of the prettiest coastlines in the country.",
        bestAreas:
          'Seaside and WaterColor for family-friendly walkability; Rosemary Beach and Alys Beach for upscale, design-forward luxury.',
        whenToBook:
          'Book 9 to 12 months out for summer and spring break; the marquee sleeps-16-plus homes in Rosemary and Alys are claimed nearly a year ahead.',
        priceBand:
          "Among the Gulf's priciest - large homes commonly run about $1,200 to $6,000-plus per night in peak season.",
        faqs: [
          {
            q: 'Which 30A towns are best for a big group?',
            a: 'Seaside and WaterColor are the family-friendly heart of 30A, while Rosemary Beach and Alys Beach deliver upscale, walkable luxury for larger groups. Homes in these towns often pair six to eight bedrooms with a carriage house and community-pool access, so a reunion stays close together.',
          },
          {
            q: 'Why are 30A rentals more expensive than nearby beaches?',
            a: "30A's planned New Urbanist towns, architecture, and scarcity of large lots make it one of the Gulf's premium markets, so big homes command higher nightly rates than Destin or Panama City Beach. The trade-off is a walkable, design-forward beach town where a group can leave the cars parked all week.",
          },
          {
            q: 'How far ahead should I book a large 30A home for summer?',
            a: 'Nine to twelve months for the marquee homes. The biggest sleeps-16-to-22 houses in Rosemary Beach and Alys Beach are claimed almost a year out for peak summer and spring-break weeks, so groups should reserve by the previous fall.',
          },
        ],
      },
      {
        townSlug: 'myrtle-beach',
        town: 'Myrtle Beach',
        state: 'SC',
        vrboDestination: 'Myrtle Beach, South Carolina, USA',
        metaDescription:
          'VRBO whole-home rentals in Myrtle Beach for groups of 12-16 - big oceanfront homes in Cherry Grove and Ocean Drive, plus golf for the crew.',
        intro:
          "Few beaches stretch a reunion budget like the Grand Strand, and the big oceanfront houses cluster north of the city in North Myrtle Beach. Its four historic sections - Cherry Grove Beach, Ocean Drive, Crescent Beach, and Windy Hill - are where you find six- and seven-bedroom homes that sleep 16, many with a pool, a wide porch, and a boardwalk to the sand. Cherry Grove in particular is beloved for its tide-pool creeks and roomy family houses. Golfers have their own reason to gather here: the Strand packs in roughly a hundred courses, so a group can tee off every morning and regroup at the beach house by afternoon. The pitch is straightforward - oceanfront square footage that would cost double on the Florida Panhandle, a kitchen big enough to feed a crowd, and a short drive to Broadway at the Beach for the kids. Myrtle Beach rewards groups that want a lot of coast for the money.",
        bestAreas:
          'North Myrtle Beach and its four sections - Cherry Grove Beach, Ocean Drive, Crescent Beach, and Windy Hill - hold the big oceanfront homes.',
        whenToBook:
          'Summer is peak, with spring drawing golf groups; book oceanfront summer weeks by late winter for the best selection.',
        priceBand:
          'Large oceanfront homes generally run about $500 to $2,200 per night, notably less than comparable Panhandle or Outer Banks houses.',
        faqs: [
          {
            q: 'Where are the big group beach houses in Myrtle Beach?',
            a: 'The large oceanfront homes cluster north of the city in North Myrtle Beach, across its four sections - Cherry Grove Beach, Ocean Drive, Crescent Beach, and Windy Hill. Six- and seven-bedroom houses sleeping 16 with a pool and porch are common, with Cherry Grove especially popular for families.',
          },
          {
            q: 'Is Myrtle Beach a cheaper option for a large group?',
            a: 'Generally, yes. Oceanfront square footage on the Grand Strand tends to cost noticeably less than comparable homes on the Florida Panhandle or the Outer Banks, which is a big reason budget-minded reunions and golf groups gravitate here.',
          },
          {
            q: 'Can a golf group and a beach reunion both work in Myrtle Beach?',
            a: 'Ideally so - the Grand Strand has roughly a hundred golf courses, so players can tee off each morning and be back at the beach house by lunch. A large oceanfront home gives golfers and non-golfers a shared base without anyone feeling stuck.',
          },
        ],
      },
      {
        townSlug: 'outer-banks',
        town: 'Outer Banks',
        state: 'NC',
        vrboDestination: 'Outer Banks, North Carolina, USA',
        metaDescription:
          'VRBO whole-home event rentals in the Outer Banks - Corolla homes of 12-20+ bedrooms with pools and theaters for the whole reunion.',
        intro:
          "Nowhere does the giant event home quite like the Outer Banks, and Corolla is its epicenter. In gated communities such as Whalehead and the oceanfront Pine Island Club, you will find rentals of 12, 16, even 20-plus bedrooms - purpose-built reunion machines with elevators, home theaters, private pools, game rooms, and boardwalks to a quiet, high-rise-free beach. Push north past the paved road into the 4x4-only sands of Carova and the wild Spanish mustangs still roam between the dunes. Duck and Nags Head suit groups wanting a smaller footprint closer to restaurants. Because a single home can sleep an entire clan of 20 to 30, the Outer Banks is the rare beach where a full reunion truly stays together, cooks together, and gathers on one enormous deck at sunset. Book the marquee Corolla homes early - the best sleep-20 houses are claimed nearly a year ahead for peak summer weeks.",
        bestAreas:
          'Corolla for the giant event homes, especially the Whalehead and oceanfront Pine Island Club communities; Duck and Nags Head for smaller groups nearer restaurants.',
        whenToBook:
          'Peak-summer weeks run Saturday to Saturday and sell out first - book the biggest Corolla homes 9 to 12 months ahead, by the prior winter.',
        priceBand:
          'Event homes span widely - roughly $1,000 to $8,000-plus per night, with the 16-to-20-bedroom Corolla houses at the high end.',
        faqs: [
          {
            q: 'How many bedrooms do Corolla event homes have?',
            a: 'Corolla is known for oversized event homes reaching 12, 16, and even 20-plus bedrooms, with the largest sleeping 30 or more. Communities like Whalehead and the oceanfront Pine Island Club specialize in these reunion houses, complete with elevators, theaters, and private pools.',
          },
          {
            q: 'Can you drive on the beach north of Corolla?',
            a: 'Yes - past the end of the paved road, the Carova area is 4x4-only sand where wild Spanish mustangs still roam. Some of the largest, most secluded event homes sit up there, though a group will need four-wheel-drive vehicles to reach them.',
          },
          {
            q: 'How early should a large Outer Banks reunion book?',
            a: 'For the biggest Corolla homes in peak summer, nine to twelve months ahead is wise, since the best sleep-20 houses rent on Saturday-to-Saturday weeks and sell out first. Booking by winter gives a large group the widest choice of event homes.',
          },
        ],
      },
      {
        townSlug: 'gatlinburg',
        town: 'Gatlinburg',
        state: 'TN',
        vrboDestination: 'Gatlinburg, Tennessee, USA',
        metaDescription:
          'VRBO whole-home cabin rentals in Gatlinburg for groups of 12-20 - Smoky Mountain lodges with game rooms, hot tubs and indoor pools.',
        intro:
          "Trade the beach for the Great Smoky Mountains and Gatlinburg answers with log lodges built for a crowd. Resort pockets like Chalet Village, minutes above downtown, and quieter Cobbly Nob to the east rent multi-level cabins that sleep 12 to 20 under soaring timber ceilings, most stacked with the amenities a rainy mountain day demands: indoor pools, home theaters, pool tables, arcade rooms, and hot tubs on decks that look straight into the national park. The park itself is the anchor, with trailheads and the Cades Cove wildlife loop minutes away, while Pigeon Forge and Dollywood keep younger cousins busy just up the parkway. For a reunion, the appeal is a self-contained basecamp - one great room big enough for the whole family, a kitchen for chili-and-cornbread nights, and enough game rooms that nobody is bored. And unlike the coasts, a sleeps-16 Gatlinburg cabin often rents for a fraction of a comparable beach house.",
        bestAreas:
          'Chalet Village just above downtown for amenity-packed lodges, and quieter Cobbly Nob to the east for mountain-view cabins.',
        whenToBook:
          'Fall leaf season in October, summer, and the Christmas lights season are peak; book 6 to 9 months ahead for those windows.',
        priceBand:
          'Large cabins commonly run about $500 to $2,500 per night - typically far less than a comparable beach house.',
        faqs: [
          {
            q: 'How many people can a large Gatlinburg cabin sleep?',
            a: 'Big Gatlinburg lodges commonly sleep 12 to 20, and a handful of resort-scale cabins go well beyond - some near Chalet Village exceed 20 bedrooms and sleep 40 or more. Most large cabins include game rooms, a home theater, and multiple hot tubs.',
          },
          {
            q: 'What is there to do near a Gatlinburg group cabin?',
            a: 'Great Smoky Mountains National Park is the anchor, with hiking trails and the Cades Cove wildlife loop minutes away. Downtown Gatlinburg, plus Pigeon Forge and Dollywood just up the parkway, give younger cousins parks, shows, and go-karts on rainy days.',
          },
          {
            q: 'Are Gatlinburg cabins cheaper than a beach house for a big group?',
            a: 'Typically, yes. A sleeps-16 Smoky Mountains cabin with an indoor pool and game rooms often rents for well below a comparable oceanfront home, which is a major reason Gatlinburg is such a popular budget-friendly reunion spot.',
          },
        ],
      },
      {
        townSlug: 'palm-springs',
        town: 'Palm Springs',
        state: 'CA',
        vrboDestination: 'Palm Springs, California, USA',
        metaDescription:
          "VRBO whole-home estate rentals in Palm Springs for groups and girls' trips - Movie Colony pool homes near downtown, ideal for Coachella.",
        intro:
          "Glass-walled mid-century estates with private pools framed by the San Jacinto Mountains - that image is Palm Springs, and it is catnip for girls' trips and milestone reunions. The historic Old Las Palmas and Movie Colony neighborhoods hide walled, gated compounds where a group of 12 to 16 can lounge poolside in total privacy, minutes from the downtown Palm Canyon Drive restaurants. Spring is prime: warm-but-not-scorching days, and the Coachella and Stagecoach festivals just down-valley in Indio draw festival houses by the dozen. Reunions like that a single estate delivers the whole holiday - a heated pool and spa, misters and fire pits for the desert evening, a cook's kitchen, and often a casita for the grandparents. Summer turns brutally hot, which is exactly why nightly rates fall off a cliff and a pool-centric house becomes a bargain. For pool-and-sun togetherness with style, few places compete with the desert.",
        bestAreas:
          'Old Las Palmas and the Movie Colony for walled mid-century pool estates near downtown Palm Canyon Drive.',
        whenToBook:
          'October through May is prime; Coachella and Stagecoach weekends in April and spring bachelorettes book earliest, while summer offers deep discounts.',
        priceBand:
          'Pool estates generally run about $800 to $4,000-plus per night in season, dropping sharply in the summer heat.',
        faqs: [
          {
            q: 'Which Palm Springs neighborhoods are best for a group rental?',
            a: "Old Las Palmas and the Movie Colony hold many of the walled, gated mid-century estates that groups want, with private pools and quick access to Palm Canyon Drive downtown. These historic celebrity enclaves are prized for architecture and privacy on a girls' trip or reunion.",
          },
          {
            q: 'Is Palm Springs cheaper in summer for large groups?',
            a: 'Much cheaper - summer heat regularly tops 110 degrees, so nightly rates on pool estates drop sharply from May through September. Groups comfortable with hot, dry days and pool-centric stays can rent striking homes for a fraction of the winter price.',
          },
          {
            q: 'Where do groups stay for Coachella and Stagecoach?',
            a: 'Many festival groups base in Palm Springs and drive down-valley to the Indio polo grounds, while others rent closer in Palm Desert, La Quinta, or Indio itself. Large pool homes across the Coachella Valley book up early for both April festival weekends.',
          },
        ],
      },
      {
        townSlug: 'nashville',
        town: 'Nashville',
        state: 'TN',
        vrboDestination: 'Nashville, Tennessee, USA',
        metaDescription:
          'VRBO whole-home rentals in Nashville for bachelorette and large groups - homes near Broadway that sleep 12-20+, some combining for 30-plus.',
        intro:
          "Nashville has become the country's bachelorette capital, and its rental market is engineered for exactly that kind of large, celebratory group. The prize location is walking distance to the Lower Broadway honky-tonks, but many crews prefer the rooftop-deck homes of The Gulch and Germantown or the hip bungalows of East Nashville, all a short pedal-tavern ride from the action. Operators here specialize in scale: side-by-side and connecting homes that combine to sleep 20, 30, even 40, so a whole friend group shares one address with a pool, rooftop bar, and space to get ready together. One thing to check before you book - Nashville regulates short-term rentals, so confirm the home holds a valid permit for non-owner-occupied stays, most reliably found in the downtown and commercial zones. Get that right and Music City hands your group live music, hot chicken, and a house built for the pre-game. It is a purpose-built party town.",
        bestAreas:
          'Homes walkable to Lower Broadway are most in-demand, with The Gulch, Germantown, and East Nashville close behind for rooftop-deck group houses.',
        whenToBook:
          'Spring through fall bachelorette weekends and CMA Fest in June are busiest; book 4 to 6 months ahead, and verify the home holds a valid short-term-rental permit.',
        priceBand:
          'Group homes generally run about $600 to $2,500 per night, with connecting multi-home setups and prime weekends higher.',
        faqs: [
          {
            q: 'Where should a bachelorette group stay in Nashville?',
            a: 'Homes within walking distance of Lower Broadway are the most sought-after, but The Gulch, Germantown, and East Nashville are close favorites with rooftop decks and quick pedal-tavern access. Many operators offer connecting or side-by-side homes that combine to sleep 20 to 40.',
          },
          {
            q: 'Do you need a permit to rent a whole house in Nashville?',
            a: 'Nashville regulates short-term rentals, and non-owner-occupied whole-home rentals require a valid permit that is easiest to find in downtown and commercial zones. Before booking a large group home, confirm the listing holds a current permit so your reservation is secure.',
          },
          {
            q: 'How big are Nashville group rentals?',
            a: 'Beyond single homes that sleep 12 to 16, Nashville operators specialize in combining adjacent units, so a bachelorette or reunion group can book one address that sleeps 24, 38, or more - often with a rooftop bar, pool, and space for the whole crew to get ready together.',
          },
        ],
      },
      {
        townSlug: 'hilton-head',
        town: 'Hilton Head',
        state: 'SC',
        vrboDestination: 'Hilton Head Island, South Carolina, USA',
        metaDescription:
          'VRBO whole-home rentals in Hilton Head for family reunions - Sea Pines and Palmetto Dunes homes with private pools, sleeping up to 24.',
        intro:
          "Hilton Head Island runs on gated resort communities, and for a reunion that framework is a feature: security gates, private beaches, and a lattice of bike paths that let kids roam safely. Sea Pines, the island's iconic community, wraps its rental homes around Harbour Town, its candy-striped lighthouse, and championship golf; Palmetto Dunes counters with an eleven-mile lagoon for kayaking plus a tennis and pickleball center. Beach-close houses in North and South Forest Beach put you steps from the sand. Homes run to seven bedrooms and bed as many as two dozen, so a Lowcountry reunion can share one shaded pool and a screened porch while splitting the cost of the island. The rhythm is gentle and multigenerational - morning bike rides, an afternoon on the calm Atlantic, oysters at sunset. Hilton Head suits groups that want an active, kid-safe, golf-and-beach week rather than a party scene.",
        bestAreas:
          'Sea Pines and Palmetto Dunes for gated-resort homes with amenities; North and South Forest Beach for beach-close houses.',
        whenToBook:
          'Summer is the family-reunion peak - book oceanfront and pool homes by winter; the spring RBC Heritage golf week is also busy.',
        priceBand:
          'Large homes generally run about $700 to $3,500 per night in summer, higher for oceanfront.',
        faqs: [
          {
            q: 'What are the best communities in Hilton Head for a family reunion?',
            a: 'Sea Pines is the marquee choice, wrapping homes around Harbour Town, its lighthouse, and golf, while Palmetto Dunes adds an eleven-mile kayaking lagoon plus tennis and pickleball. For beach-close houses, North and South Forest Beach put groups steps from the sand.',
          },
          {
            q: 'How many guests do large Hilton Head rentals sleep?',
            a: 'Big Hilton Head homes run up to about seven bedrooms and bed as many as two dozen guests. Most gated-community houses include a private pool and screened porch, so a multigenerational reunion can share one home behind a security gate.',
          },
          {
            q: 'Is Hilton Head good for kids and grandparents together?',
            a: 'Very - the island is famously bike-friendly, with paved paths linking homes to calm Atlantic beaches, making it easy and safe for kids to roam and grandparents to stroll. That gentle, active pace is why so many multigenerational reunions choose Hilton Head over party-focused beaches.',
          },
        ],
      },
      {
        townSlug: 'lake-tahoe',
        town: 'Lake Tahoe',
        state: 'CA',
        vrboDestination: 'Lake Tahoe, California, USA',
        metaDescription:
          'VRBO whole-home lakefront rentals at Lake Tahoe for groups of 12-20 - South Lake Tahoe and Tahoe City lodges for summer and ski trips.',
        intro:
          "Lake Tahoe is a two-season reunion destination, and the lakefront lodges are built to work in both. Summer brings groups to South Lake Tahoe and the North Shore around Tahoe City for beach days, boat mooring, and paddle-outs on the bluest water in the Sierra; winter fills the same houses with ski crews bound for Heavenly, Palisades Tahoe, and Northstar. Across the state line, Incline Village and Zephyr Cove add quieter, upscale lakefront estates on the Nevada side. Big homes here mean 12 to 20 sleepers with stone fireplaces, game rooms, hot tubs, and decks angled at the water or the peaks. For a reunion, one lodge covers every energy level - hikers and boaters by day, the board-game-and-fire crowd by night - and everyone wakes up to the same lake view. Reserve early for holiday ski weeks and the July and August lake season, when the best lakefront houses vanish first.",
        bestAreas:
          'South Lake Tahoe for lodging and nightlife, Tahoe City for the quieter North Shore, and Incline Village or Zephyr Cove for upscale lakefront estates on the Nevada side.',
        whenToBook:
          'Reserve 60 to 90 days out at minimum, and earlier for the July-August lake season and the Christmas and New Year ski weeks.',
        priceBand:
          'Lakefront lodges generally run about $600 to $3,500-plus per night, peaking in summer and holiday ski weeks.',
        faqs: [
          {
            q: 'When is the best time to book a large Lake Tahoe house?',
            a: 'Reserve early for the two peaks: the July-and-August lake season and the winter holiday ski weeks. Groups of 12 or more are advised to book lakefront lodges 60 to 90 days out at minimum, and even earlier for Christmas, New Year, and prime summer weekends.',
          },
          {
            q: 'Which side of Lake Tahoe should a group stay on?',
            a: 'South Lake Tahoe offers the most lodging plus nightlife at the Nevada state line, while Tahoe City and the North Shore feel quieter and more scenic. For upscale lakefront estates, Incline Village and Zephyr Cove on the Nevada side are the premium picks.',
          },
          {
            q: 'Can a Lake Tahoe reunion work in both summer and winter?',
            a: 'Absolutely - one lodge covers both. Summers bring boating, beaches, and hiking on the California shore, while winters put groups minutes from Heavenly, Palisades Tahoe, and Northstar, with the same fireplace, hot tub, and game room waiting at the end of the day.',
          },
        ],
      },
      {
        townSlug: 'galveston',
        town: 'Galveston',
        state: 'TX',
        vrboDestination: 'Galveston, Texas, USA',
        metaDescription:
          'VRBO whole-home beach rentals in Galveston for groups of 12-16 - West End houses in Pirates Beach and Jamaica Beach, an easy drive from Houston.',
        intro:
          "For families scattered across Texas, Galveston is the reunion that everyone can drive to - roughly an hour from Houston and a straight shot down I-45 to the closest Gulf beach. The action for big groups is the West End, where Pirates Beach, Jamaica Beach, and Sea Isle rent classic stilted beach houses, and where Pointe West adds a beach club with pools and cabanas at the island's far tip. These homes routinely sleep 12 to 16, with wraparound decks, ground-level party space, and a golf cart for beach runs. On the East End, the historic Strand district and Pleasure Pier give groups a rainy-day plan and a dose of Victorian-port charm. What makes Galveston click for reunions is the low bar to entry: no flights, an easy drive for grandparents, affordable square footage, and sand within a short walk of the kitchen door. It is the Gulf Coast without the airfare.",
        bestAreas:
          "The West End - Pirates Beach, Jamaica Beach, and Sea Isle - for big stilted beach houses, plus Pointe West with its beach club near the island's tip.",
        whenToBook:
          'Summer and spring break are peak; book summer weekends a few months out, and note Mardi Gras draws crowds in late winter.',
        priceBand:
          'Large West End beach houses generally run about $450 to $2,000 per night, among the most affordable Gulf options.',
        faqs: [
          {
            q: 'Where are the large group beach houses in Galveston?',
            a: "The West End holds the big rentals - Pirates Beach, Jamaica Beach, and Sea Isle are full of stilted beach houses sleeping 12 to 16, and Pointe West at the island's tip adds a beach club with pools and cabanas. These homes typically include wide decks and a golf cart for beach runs.",
          },
          {
            q: 'How far is Galveston from Houston?',
            a: 'Galveston sits about an hour south of Houston straight down I-45, making it the closest Gulf beach for much of Texas. That easy drive - no flights, no long haul for grandparents - is a big reason Texan families pick it for reunions.',
          },
          {
            q: 'Is Galveston affordable for a big group?',
            a: 'Relatively, yes. Large West End beach houses generally rent for less than comparable homes in Destin or on 30A, and skipping airfare by driving in keeps the whole trip budget-friendly, especially for extended Texas and Gulf-region families.',
          },
        ],
      },
      {
        townSlug: 'branson',
        town: 'Branson',
        state: 'MO',
        vrboDestination: 'Branson, Missouri, USA',
        metaDescription:
          'VRBO whole-home lodge rentals in Branson for family reunions - big Table Rock Lake cabins sleeping 20-40 near Silver Dollar City.',
        intro:
          "Branson built its whole identity around family fun, which makes it one of the easiest reunion towns in the middle of the country. The big lodges cluster around Table Rock Lake and the Indian Point peninsula, many within minutes of Silver Dollar City, the Ozarks theme park known for its craft fairs and thrill rides. Reunion cabins here run large - eight to fourteen bedrooms sleeping 26 to 40 - with wraparound lake-view decks, fire pits, pool tables, and great rooms sized for a whole clan. Beyond the lake, the 76 Country Boulevard strip and Branson Landing stack live shows, mini-golf, and dinner within a short drive. The appeal is value and drive-ability: for much of the Midwest and South, Branson is a tank of gas away, and a sprawling lakefront lodge rents for a fraction of a coastal equivalent. Add a boat rental on Table Rock and a reunion practically plans itself.",
        bestAreas:
          'Table Rock Lake and the Indian Point peninsula for big lake lodges, many within minutes of Silver Dollar City.',
        whenToBook:
          'Summer, the fall foliage-and-festival stretch, and the Christmas lights season are busiest; booking 3 to 6 months ahead is usually plenty.',
        priceBand:
          'Large lakefront lodges generally run about $400 to $1,800 per night - a fraction of comparable coastal homes.',
        faqs: [
          {
            q: 'What kind of large rentals does Branson have for reunions?',
            a: 'Branson specializes in oversized lake lodges and cabins around Table Rock Lake and Indian Point, with eight- to fourteen-bedroom homes sleeping 26 to 40. Expect wraparound lake-view decks, fire pits, pool tables, and great rooms built to hold an entire extended family.',
          },
          {
            q: 'What is there to do in Branson for a family group?',
            a: 'Silver Dollar City theme park anchors the fun, and the 76 Country Boulevard strip plus Branson Landing stack live shows, mini-golf, and dining. On the water, Table Rock Lake offers boating and swimming, so a reunion can mix lake days with the town\'s entertainment.',
          },
          {
            q: 'Is Branson a budget-friendly reunion destination?',
            a: 'Notably so - big lakefront lodges here rent for a fraction of coastal equivalents, and Branson is within an easy drive of much of the Midwest and South. That drive-ability plus low nightly rates is exactly why so many large family reunions land here.',
          },
        ],
      },
      {
        townSlug: 'austin',
        town: 'Austin',
        state: 'TX',
        vrboDestination: 'Austin, Texas, USA',
        metaDescription:
          'VRBO whole-home rentals in Austin for bachelorette and large groups - downtown homes near Rainey Street and Lake Travis pool compounds.',
        intro:
          "Austin splits into two very different large-group trips, and the best reunions pick a lane. Downtown, homes near Rainey Street and South Congress put a crew within walking or short-ride distance of the bars, live music, and food trucks - ideal for bachelorette weekends built around Sixth Street. Out west, the Lake Travis hills hide resort-style houses with private pools, sport courts, hot tubs, and kayak access for groups that want a quieter, spread-out compound. Either way, homes that sleep 16 with a pool are the sweet spot. Timing is everything here: the city's marquee weeks - SXSW in March, Austin City Limits in October, the Formula 1 race in November - send rates soaring and inventory vanishing, so lock in early if your dates overlap. For a group that wants live music, great food, and either a downtown base or a lake escape, Austin delivers both versions of the same city.",
        bestAreas:
          'Downtown around Rainey Street and South Congress for walkable nightlife; the Lake Travis hills for pool-and-boat compounds.',
        whenToBook:
          'Book 6-plus months ahead if your dates hit SXSW in March, Austin City Limits in October, or the November Formula 1 race, when rates spike.',
        priceBand:
          'Group homes generally run about $700 to $3,500 per night, surging well higher during the marquee event weeks.',
        faqs: [
          {
            q: 'Should a group stay downtown or on Lake Travis in Austin?',
            a: 'It depends on the trip. Downtown homes near Rainey Street and South Congress suit bachelorette and nightlife-focused groups who want to walk to bars, while Lake Travis houses give quieter, spread-out compounds with private pools and boat access for a laid-back reunion.',
          },
          {
            q: 'When are Austin rentals most expensive?',
            a: 'During the city\'s marquee weeks - SXSW in March, Austin City Limits in October, and the Formula 1 Grand Prix in November - rates spike and homes sell out fast. Groups whose dates overlap these events should book six or more months ahead.',
          },
          {
            q: 'Do large Austin homes have private pools?',
            a: 'Many do, and a pool is close to essential in the Texas heat. Lake Travis compounds commonly feature private pools, hot tubs, and sport courts, while downtown group homes are more mixed - so confirm the pool if summer cooling-off is a priority for your crew.',
          },
        ],
      },
    ],
  },
];

// ── lookup + parse ───────────────────────────────────────────────────

const CLUSTER_BY_SLUG = new Map<string, RentalCluster>(
  RENTAL_CLUSTERS.map((c) => [c.slug, c]),
);

export function findCluster(slug: string): RentalCluster | null {
  return CLUSTER_BY_SLUG.get(slug) ?? null;
}

/** A resolved cluster route: hub or one town page. */
export type ClusterRoute =
  | { kind: 'cluster-hub'; cluster: RentalCluster }
  | { kind: 'cluster-town'; cluster: RentalCluster; town: ClusterTown };

/**
 * Parse a /rentals/[slug] slug against the curated clusters ONLY. Returns
 * null if it isn't a cluster slug — the page then falls through to the
 * matrix parser (`parseRentalSlug`). Checked BEFORE the matrix so curated
 * slugs always win.
 */
export function parseClusterSlug(slug: string): ClusterRoute | null {
  for (const cluster of RENTAL_CLUSTERS) {
    const marker = `${cluster.slug}-in-`;
    if (slug.startsWith(marker)) {
      const townSlug = slug.slice(marker.length);
      const town = cluster.towns.find((t) => t.townSlug === townSlug);
      return town ? { kind: 'cluster-town', cluster, town } : null;
    }
    if (slug === cluster.slug) return { kind: 'cluster-hub', cluster };
  }
  return null;
}

export function clusterHubPath(cluster: RentalCluster): string {
  return `/rentals/${cluster.slug}`;
}

export function clusterTownPath(cluster: RentalCluster, town: ClusterTown): string {
  return `/rentals/${cluster.slug}-in-${town.townSlug}`;
}

/** Every cluster slug (hubs + town pages) — for the sitemap + static params. */
export function enumerateClusterSlugs(): string[] {
  const out: string[] = [];
  for (const cluster of RENTAL_CLUSTERS) {
    out.push(cluster.slug);
    for (const town of cluster.towns) out.push(`${cluster.slug}-in-${town.townSlug}`);
  }
  return out;
}

/** Sitemap sections, one per cluster (hub first, then its towns). */
export function clusterSitemapSections(): { name: string; paths: string[] }[] {
  return RENTAL_CLUSTERS.map((cluster) => ({
    name: cluster.sitemapSection,
    paths: [
      clusterHubPath(cluster),
      ...cluster.towns.map((t) => clusterTownPath(cluster, t)),
    ],
  }));
}

/** Curated clusters whose relatedCategorySlug matches (category → clusters). */
export function clustersForCategory(categorySlug: string): RentalCluster[] {
  return RENTAL_CLUSTERS.filter((c) => c.relatedCategorySlug === categorySlug);
}

/** Other towns in the same cluster (sibling internal links). */
export function siblingClusterTowns(
  cluster: RentalCluster,
  currentTownSlug: string,
  limit = 10,
): { label: string; href: string; state: string }[] {
  return cluster.towns
    .filter((t) => t.townSlug !== currentTownSlug)
    .slice(0, limit)
    .map((t) => ({
      label: `${cluster.name} in ${t.town}`,
      href: clusterTownPath(cluster, t),
      state: t.state,
    }));
}

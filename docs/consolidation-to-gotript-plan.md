# Consolidation to gotript.com — architecture + redirect inventory (PLAN, nothing deployed)

**Decision:** operate ONE consumer travel brand — **gotript.com** — and migrate gobookt,
numiworks, stayviaowner into it as sections. This artifact defines the target architecture
and the URL-by-URL redirect inventory. **No redirects are deployed and nothing is deleted.**

## Why consolidate (calibrated — not an overclaim)
We do **not** have proof Google applied a "four-site network penalty" for shared owner/host.
What we *do* know is sufficient on its own: the portfolio is **oversized, heavily overlapping,
low-authority, and operationally costly**. After ~40 days of real fixes (sitemap/noindex
consistency, cross-brand metadata, single-owner, itinerary prune, Phase 2A/2B/2C) the four
sites combined earn **~218 impressions/day** (gobookt 96, stayviaowner 112, numiworks 10,
gotript 0) on deep-position, near-zero-volume long-tail queries. The overlap is concrete:

| Family | gotript | gobookt | numiworks | stayviaowner | dup total |
|---|--:|--:|--:|--:|--:|
| `celebrations/{occasion}` | 2,025 | 2,025 | 2,025 | 2,025 | **8,100** |
| `stays-near/{poi}` | (dropped) | 949 | 949 | 949 | 2,847 |
| `destinations/{city}` | 164 | 164 | 164 | 164 | 656 |
| occasion/persona/tours/hotels families | duplicated across 2–3 sites each | | | | ~thousands |

**Honest caveat:** consolidation is **necessary but not sufficient**. The 5k/day comparison
sites have (a) real backlinks and (b) content on real-demand queries. Consolidation removes
complexity and concentrates effort/authority into one domain, but without authority + demand-
targeted content it will not hit 5k/day. Full data: `docs/_data/consolidation-family-counts.csv`.

## Why gotript is the survivor (not the current best performer)
Choose the brand that can host the **whole** travel journey for years, not the best single-day
number. gotript = trip planning (broad umbrella). stayviaowner = rentals only (narrow),
gobookt = booking-only tone, numiworks = doesn't read as travel. gotript's current 0 is a
recoverable state, not a reason to abandon the only umbrella-capable name.

## Target gotript architecture — ONE hierarchy (not dozens of flat patterns)
Target **~3,000–5,000 intentional indexable pages** (exact count follows the surviving map):
```
/destinations/{city}                      hub (keep)
/plan/{city}                              planner (gotript's unique surface)
/itineraries/{city}/{n}-days             from numiworks itineraries
/hotels/{city}[/{theme}]                 from gobookt  (Booking.com)
/rentals/{city}[/{category}]             from stayviaowner (Vrbo)
/things-to-do/{city}[/{category}]        from numiworks (Viator)
/guides/{city}/best-time-to-visit        climate (keep best-time only)
/guides/{city}/{persona}                 with-kids, with-teens, budget, airport, first-time, how-many-days
```
Each affiliate stream survives as a **section** (keep all revenue): `/hotels/`=Booking,
`/rentals/`=Vrbo, `/things-to-do/`=Viator, `/plan//guides//itineraries/`=gotript planning.

## Redirect inventory — disposition per family (path-specific 301s, true equivalents only)
| Source family | New gotript URL | Disposition |
|---|---|---|
| gobookt `hotels-in-{city}` (+ best/cheap/luxury/boutique/family/pet-friendly/beach) | `/hotels/{city}` (themes → `/hotels/{city}/{theme}` or fold to one) | **301** |
| gobookt `where-to-stay-in-{city}` (159) | `/guides/{city}/where-to-stay` | **301** |
| gobookt `apartments-in-{city}` | `/rentals/{city}` | **301** |
| gobookt/numiworks/stayviaowner `stays-near/{poi}` | curated → `/hotels/{city}`; rest **410** | **mostly 410** (thin) |
| numiworks `tours/{category}` (1,874) + `tours-in`/`private-tours`/`walking-tours`/`things-to-do-in-{city}` | `/things-to-do/{city}[/{category}]` | **301** |
| numiworks `attractions/{slug}`, `museums-in`, `top-attractions`, `free-things-to-do`, `day-trips-from`, `best-food-tours`, `best-family-activities` | `/things-to-do/{city}` (+ `/attractions`) | **301** |
| numiworks `{city}-N-day-itinerary` (noindexed now) | `/itineraries/{city}/{n}-days` | **301** (revive under new structure) |
| stayviaowner `rentals/{category}` (3,114) + `apartments`/`vacation-rentals` | `/rentals/{city}[/{category}]` | **301** |
| stayviaowner `group-travel`/`hot-tub-cabins`/`farm-stays`/`reunion-villas` | `/rentals/{category}` | **301** (real inventory) |
| ALL `destinations/{city}` (656 across sites) | `/destinations/{city}` (one) | **301 / merge** |
| `celebrations/{occasion}` (8,100 across sites) | curated rental/planning subset → `/guides/{city}/celebrations/{occasion}`; bulk **410** | **curate + 410** |
| gotript `{city}-weather-in-{month}` / `{season}-in-{city}` / `where-to-go-in-{month}` | — (keep best-time only) | **410 / noindex** (Phase 2B) |
| gotript flights/cars (thin affiliate) | — | **410** (no owner) |
| gotript persona/planning (with-kids, budget, airport, how-many-days, first-time…) | `/guides/{city}/{persona}` | **RESTRUCTURE 301** (old flat → new) |

**Rule:** redirect ONLY where a genuine equivalent exists. No blanket redirect to the
homepage or a vaguely-related city. No-equivalent pages return **404/410**.

## Execution order (sequential, one domain at a time)
1. **Build gotript's new `/hotels`, `/rentals`, `/things-to-do`, `/itineraries`, `/guides`,
   `/plan` sections FIRST** — live equivalents before anything is redirected.
2. **numiworks first** (lowest current signal) → 301 into `/things-to-do` + `/itineraries`.
3. **gobookt second** → 301 into `/hotels`.
4. **stayviaowner LAST** (best position 39.5 + real rental intent — preserve that signal until
   `/rentals` is genuinely ready).

## Redirect mechanics (keep the domains + projects — do NOT delete)
- Keep gobookt/numiworks/stayviaowner **domains registered** and their Vercel projects live,
  reduced to **redirect-only** apps (path-specific 301s; optional 410s; no content, no sitemaps
  except a temporary migration sitemap).
- Use **path-specific** rules, NOT a whole-domain redirect (structures differ). Example:
  ```js
  // numiworks redirect-only app — next.config.js
  async redirects() {
    return [
      { source: '/things-to-do-in-:city', destination: 'https://gotript.com/things-to-do/:city', permanent: true },
      { source: '/:city-:n(\\d+)-day-itinerary', destination: 'https://gotript.com/itineraries/:city/:n-days', permanent: true },
    ];
  }
  ```
- **GSC per retiring domain:** verify old + new properties, submit the old final sitemap +
  new gotript sitemap, use **Change of Address**, monitor indexing + redirect errors.
- Keep redirects in place **long-term**. Retire the full apps only after: redirects verified,
  Change of Address done, old URLs consistently 301/404/410, traffic + crawl shifted — then
  replace each with a tiny redirect-only project. **Delete nothing today.**

## What NOT to do
Do not: merge all 46k URLs into gotript; preserve every weak page for theoretical equity;
build another universal shared content engine; 301 retired URLs to the homepage/hubs; launch
all three migrations at once; or treat consolidation as a substitute for content + authority.

## After consolidation — the actual growth levers
1. Prune to a few hundred genuinely useful, demand-targeted pages per section.
2. Earn real backlinks (digital PR, niche directories, link-worthy tools/data).
3. Build depth on queries with real search volume — not city×occasion permutations.

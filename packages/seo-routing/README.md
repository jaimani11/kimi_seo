# @adored/seo-routing

Programmatic-SEO slug parsers shared across brands.

## Current shape (v1 — collapse, don't redesign)

Two parser flavors, moved verbatim from the apps that grew them:

| Module | Used by | Route kinds |
|--------|---------|-------------|
| `./viator` | numiworks | itinerary, weekend, themed-list (18 themes), comparison, things-to-do |
| `./multicategory` | gotript, gobookt, stayviaowner | everything in viator **plus** hotels-in, flights-to, cars-in, hotels-themed (8 sub-shapes), flights-themed, cars-themed, things-themed, cruise-region |

v1 deliberately keeps them as two files: they were 3 identical copies +
1 divergent copy across apps; now they are 2 canonical modules. A wrong
regex here 404s thousands of indexed pages, so the structural merge is
its own reviewed change, not a side effect of the move.

## v2 design — pattern registry (planned)

One core + composable pattern packs:

```ts
interface SeoPattern<K extends string> {
  kind: K;
  /** Try to parse; null = not this pattern. */
  parse(slug: string): SeoRouteMatch | null;
  /** All valid slugs for the sitemap/static-params. */
  enumerate(): string[];
  /** Per-city related links for internal linking. */
  cityLinks?(city: SeoCity): SeoLink[];
}

createSeoRouter(patterns: SeoPattern[]) // → { parseSeoSlug, enumerateAllSeoSlugs, buildCitySeoLinks }
```

Brands then compose: `createSeoRouter([...CORE_PATTERNS, ...MULTICATEGORY_PATTERNS])`.
Migration test: golden-file both current parsers' `enumerateAllSeoSlugs()`
output and assert byte-equality after the registry refactor — the
enumeration IS the sitemap, so equality proves zero SEO regression.

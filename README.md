# Adored Moments Platform

Multi-brand travel publishing platform. All brands under Adored Moments LLC live in one repo, share shared packages, and are launched via per-brand config files.

## Brands

| App | Domain | Focus |
|-----|--------|-------|
| `apps/numiworks` | numiworks.com | AI travel planner, Viator + GetYourGuide experiences |
| `apps/gotript` (pending migration) | gotript.com | Expedia + VRBO multi-category |
| `apps/gobookt` (pending migration) | gobookt.com | Booking.com hotels |
| `apps/stayviaowner` (pending migration) | stayviaowner.com | VRBO vacation rentals |

## Structure

```
adored-moments-platform/
├── apps/                      # One Next.js app per brand
│   └── numiworks/
├── packages/                  # Shared packages (populated over time)
├── package.json               # Workspace root
├── pnpm-workspace.yaml
├── turbo.json                 # Turborepo pipeline config
└── tsconfig.base.json
```

## Getting started

```bash
# Install everything
pnpm install

# Run a specific app in dev
pnpm --filter numiworks dev

# Build a specific app
pnpm --filter numiworks build

# Build everything
pnpm build
```

## Packages

| Package | What lives here |
|---------|-----------------|
| `@adored/brand-config` | One `BrandConfig` per brand: name, domain, siteUrl, colors, affiliate labels + camref, Pinterest board. The "new brand = one file" primitive. |
| `@adored/seo-data` | Cities (195), rich destination guides (140), Destination Intelligence scores, attraction pages. **Add a city here once → all brands get it.** |
| `@adored/affiliate` | Host allowlist, GetYourGuide deeplinks, Expedia multi-category **factory** (brand-parameterized: label/`_src`/camref bound from brand-config). |
| `@adored/marketing` | Marketing schemas, city rotation + popularity weighting, Pinterest v5 client, social content schemas. |

Apps keep thin shim files at their old import paths (`src/lib/seo/cities.ts` → re-export from `@adored/seo-data`) so zero call sites changed during extraction.

## Migration status

- [x] Workspace skeleton (Turborepo + pnpm)
- [x] All 4 apps migrated and building (`pnpm build` → 4/4)
- [x] `@adored/brand-config` — 4 brands defined; consumed by origin.ts + expedia shims
- [x] `@adored/seo-data` — cities/guides/scores/attractions shared (gotript/gobookt/stayviaowner gained the ~20 guides they were missing)
- [x] `@adored/affiliate` — allowlist + GYG + Expedia factory
- [x] `@adored/marketing` — schemas, rotation, popularity, Pinterest client
- [x] SITE_URL discipline: `VERCEL_URL` removed from origin.ts + layout metadataBase in all apps
- [ ] Phase 3b: marketing scheduler/adapters/template-generator behind `createMarketingEngine(brand)` (needs brand DI for CTAs, hashtags, branded URLs, imagery)
- [ ] `packages/ui` — deferred: headers/pages diverge per brand *by design*; extract only after brand theming tokens exist
- [ ] Route-parser unification (numiworks's Viator-flavor vs Expedia-family flavor differ meaningfully)
- [ ] Vercel cutover (see below)

## Vercel cutover (per site, one at a time)

1. Vercel dashboard → the site's project → Settings → Git → Disconnect old repo → Connect `jaimani11/adored-moments-platform`.
2. Settings → General → **Root Directory** = `apps/<name>` (e.g. `apps/numiworks`). Enable "Include files outside root directory" (needed for workspace packages).
3. Build command stays `next build` (Vercel auto-detects pnpm workspace + Turborepo).
4. Env vars: unchanged — they live on the project, not the repo. Add `NEXT_PUBLIC_SITE_URL=https://www.<domain>.com` if not already set.
5. Deploy → verify prod URLs (home, one `/destinations/x`, one themed slug, `/sitemap.xml`, `/admin/marketing`).
6. Only after verification: archive the old standalone repo.

Once shared packages are extracted, launching a new brand takes:
1. Copy `apps/{template}/` → `apps/{new-brand}/`
2. Create `brands/{new-brand}.ts` with name, colors, affiliate labels
3. Point domain at Vercel → done

## Env vars (per app)

Every app requires:
```
SITE_URL=https://www.<domain>.com    # canonicals, sitemap, JSON-LD
NEXT_PUBLIC_SITE_URL=<same>
```
Plus its own affiliate + analytics + Pinterest credentials. See individual app READMEs.

## Non-negotiables

- **Never use `VERCEL_URL`** for canonical / sitemap / OG / JSON-LD. Always `SITE_URL`.
- **Preserve affiliate integrations** across migrations — commission tracking cannot break.
- **Preserve Pinterest automation** — daily cron on numiworks is live.
- **Preserve admin dashboards** — operators log in daily.

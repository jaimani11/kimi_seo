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

## Migration status

- [x] Workspace skeleton (Turborepo + pnpm)
- [x] numiworks moved to `apps/numiworks/`
- [ ] gotript migration
- [ ] gobookt migration
- [ ] stayviaowner migration
- [ ] Extract `packages/seo` (cities + route parser + destination content)
- [ ] Extract `packages/affiliate` (Expedia + VRBO + Booking + Viator + GYG providers)
- [ ] Extract `packages/marketing` (Pinterest / Instagram / TikTok scheduler)
- [ ] Extract `packages/ui` (SiteHeader / SeoPageShell / cards)
- [ ] Per-brand config file (`brands/{name}.ts` — brand identity, colors, nav, affiliate mix)

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

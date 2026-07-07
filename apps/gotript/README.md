# gotript

Multi-category Expedia affiliate travel hub — hotels, flights,
things to do, car rentals, and cruises.

Sister site to numiworks. Same codebase architecture, different
affiliate network, different brand.

## Stack

- Next.js 16 (App Router) on Node.js runtime
- React server + client components
- TypeScript end to end
- Vitest test suite
- Tailwind for utility classes; theme tokens in CSS variables
- Anthropic SDK for the AI concierge
- Expedia Partners affiliate program (multi-vertical)

## Env vars to set in Vercel

Production-only unless noted.

| Name | What it is |
|------|------------|
| `EXPEDIA_AFFILIATE_ID` | Your Expedia `aid` (sub-account id). Without it the URLs still work, attribution doesn't track. |
| `EXPEDIA_AFFILIATE_LABEL` | Optional sub-channel label. Defaults to `gotript`. |
| `NEXT_PUBLIC_STAYSCOUT_ACTIVE_STAY_PROVIDER` | Already defaults to `expedia` in code. Override only to fall back to viator/expedia. |
| `ANTHROPIC_API_KEY` | Powers the AI concierge. |
| `ADMIN_PASSWORD` | Password gate for `/admin/marketing`. |
| `ADMIN_SESSION_SECRET` | 32+ char random string. |
| `CRON_SECRET` | Random string for `/api/cron/marketing-daily`. |
| `PINTEREST_ACCESS_TOKEN` | OAuth token with `pins:write,boards:read`. |
| `PINTEREST_BOARD_ID` | Numeric ID of the board to pin to. |

## Top-level routes

- `/` — multi-category hero + AI concierge + popular destinations
- `/stays` — hotels search hub
- `/flights` — flights search hub
- `/things-to-do` — attractions search hub
- `/cars` — car rentals search hub
- `/cruises` — cruises search hub
- `/destinations/[slug]` — per-city trip-planning guide
- `/admin/marketing` — daily auto-posting controls (password-gated)
- `/privacy`, `/terms` — public policies

## How the search hero works

The home page hero has 5 tabs (Stays / Flights / Things to do / Cars
/ Cruises). The user picks a category + destination + dates + party
and submits. The form POSTs to `/api/go/booking`, which:

1. Validates the category against the allowlist
2. Builds the right Expedia URL via
   `lib/affiliate/expedia-multicategory.ts`
3. Attaches the affiliate id, label, and `_src=gotript`
4. 302s the browser to Expedia in a new tab

Adding a new category is one entry in `CATEGORY_META` plus a builder
function in the same file.

## Forked from

This repo was forked from numiworks at commit `fc69cb9` and rebranded
+ restructured for the multi-category Expedia affiliate program.
The destination guides (175 cities × 8 sections), the SEO route
fan-out (1992 indexable URLs), the marketing automation, the
Pinterest integration, and the analytics pipeline are all preserved.

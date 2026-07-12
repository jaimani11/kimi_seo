# Technical-SEO Playbook

How canonicalization, indexability, and structured data work across every
site in this monorepo — and the checklist for launching site #5 … #20 without
re-introducing the bugs we've already fixed.

The network runs one www host per brand. Everything below enforces that
convention in **code** (version-controlled, copies with the app shell) rather
than in per-site dashboards (easy to forget — which is exactly how
`gobookt.com` shipped serving two live homepages).

---

## 1. Canonical host = `www`

Each brand's canonical origin is its `siteUrl` in
[`packages/brand-config/src/brands.ts`](../packages/brand-config/src/brands.ts),
always `https://www.<domain>`. Two mechanisms keep every request and every
emitted URL on that host:

- **`getSiteOrigin()`** ([`apps/*/src/lib/site/origin.ts`](../apps)) returns
  the www origin (or `NEXT_PUBLIC_SITE_URL` for staging). It is the single
  source for canonicals, sitemaps, `metadataBase`, JSON-LD, and OpenGraph.
  `VERCEL_URL` is never consulted — deployment URLs must not leak.

- **Middleware host redirect** ([`apps/*/src/middleware.ts`](../apps)):
  `canonicalHostRedirect()` 308-redirects any non-canonical host (bare apex,
  wrong host) to the www host, preserving path + query. It skips `localhost`
  and `*.vercel.app` so dev and preview deployments still work. Because it
  derives the target from `getSiteOrigin()`, it is **identical across all
  sites** and needs no per-site configuration.

> Belt-and-suspenders: also set the www domain as **Primary** in each Vercel
> project (Settings → Domains → "Redirect to www…"). Vercel's edge redirect is
> faster, but the middleware guarantees correctness even if that's forgotten.

## 2. Self-referencing `<link rel="canonical">` on every page

Google flagged "Duplicate without user-selected canonical" because the
homepage and core static pages emitted **no** canonical at all. Fixed
network-wide:

- Middleware publishes the request path as the **`x-pathname`** header.
- The root layout's `generateMetadata()` reads it and emits an absolute,
  self-referencing canonical (`${getSiteOrigin()}${pathname}`), **pathname
  only** — query strings drop so `?utm=` / `?ss=` variants consolidate.
- Pages that need a different canonical (e.g. the ~48 programmatic templates)
  set their own `alternates.canonical`, which overrides the layout default.
- If `x-pathname` is ever absent, no canonical is emitted — no regression.

Invariant: **exactly one** canonical tag per page, pointing at the www host.
`scripts/seo-audit.sh` asserts this.

## 3. Sitewide structured data

- **Organization + WebSite** JSON-LD (with a `SearchAction` sitelinks
  searchbox → `/search?q=`) is emitted once in the root layout `<head>` via
  `siteJsonLd()` in `origin.ts`.
- **Per-page** JSON-LD lives in `apps/*/src/features/seo/*` — Breadcrumb, FAQ,
  Product/Offer, TouristAttraction, itinerary, and destination schemas on the
  programmatic templates.

## 4. robots.txt + sitemap

- `robots.txt` references `https://www.<domain>/sitemap.xml`.
- `sitemap.xml` lists only canonical www URLs (no apex, no `*.vercel.app`).
- Keep every URL in the sitemap a **200** — never list a URL that 404s or
  redirects. The audit script spot-checks a sample.

---

## Launch checklist — new site (#5 … #20)

**Code (this repo):**
1. Add the brand to `packages/brand-config/src/brands.ts` (`siteUrl` =
   `https://www.<domain>`).
2. Copy the closest app shell in `apps/`; point its `origin.ts` import at the
   new brand. Middleware, canonical metadata, and `siteJsonLd()` come along
   for free — no per-site edits.
3. Give the homepage `page.tsx` a keyword-first `<title>` + description + OG
   (don't rely on the generic layout default).
4. `pnpm build` → confirm the app compiles.

**Infra (user-side, per site):**
5. Vercel → add both `<domain>` and `www.<domain>`; set **www as Primary**.
6. DNS → apex `A`/`ALIAS` + `www` `CNAME` to Vercel. Confirm the apex actually
   resolves (a missing apex A record shows as `000` in the audit).
7. Set env vars (`RESEND_*`, provider keys, `NEXT_PUBLIC_SITE_URL` only if
   staging).

**Search Console (user-side, per site):**
8. Add the **Domain property** (covers apex + www + http/https).
9. Submit `https://www.<domain>/sitemap.xml` under Sitemaps.
10. URL-inspect the homepage → Request Indexing. Repeat for ~20 flagship pages.

**Verify:**
11. `scripts/seo-audit.sh <domain>` → expect all ✓.

---

## Running the audit

```bash
scripts/seo-audit.sh                       # the 4 live sites
scripts/seo-audit.sh gobookt.com           # one site
SAMPLE=25 scripts/seo-audit.sh newsite.com # deeper sitemap sampling
```

Non-zero exit if any domain has a FAIL — safe to wire into CI or a cron.

## Known user-side follow-ups

- **gotript.com apex** returns no response (`000`) — needs a DNS `A`/`ALIAS`
  record for the bare apex. `www.gotript.com` works; the middleware redirect
  can't fire on a host that never resolves.
- Submit each site's sitemap in Search Console (see checklist step 9).

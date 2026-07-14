# AI-Crawler Policy & Reversible Per-Bot Switch

**Date:** 2026-07-13
**Applies to:** all four apps (numiworks, gotript, gobookt, stayviaowner)

A single, reversible control over which bots may crawl the sites, enforced in two
places from **one shared source** — `packages/seo-routing/src/crawler-policy.ts`:

- **robots.txt** (polite `Disallow`) — each app's `app/robots.ts`
- **middleware 403** (hard enforcement) — each app's `middleware.ts`

Both are needed because **robots.txt is advisory** — a misbehaving bot ignores it, and
every hit still costs a function invocation. The middleware 403 stops it at the edge.

## The switch — `AI_BOTS_BLOCKED`

- Comma-separated user-agent tokens, e.g. `AI_BOTS_BLOCKED=Bytespider,GPTBot`.
- **Case-insensitive substring** match against the request `User-Agent`.
- **Default (unset/empty): nothing is blocked** — every AI answer engine stays welcome,
  GEO reach preserved. The feature changes nothing until you set the var.
- **To block** a bot: add its token. **To unblock**: remove it. Then **redeploy** — Vercel
  binds env vars at deploy time, so it's an env edit + redeploy, **no code change**.
- Set it **per project** (each site independently) in Vercel → Settings → Environment Variables.

When a bot is listed, two things happen on the next deploy:
1. `robots.txt` drops it from the AI "allow" group **and** adds a `Disallow: /` rule.
2. `middleware` returns **403** at the edge before any session mint or render — which also
   removes that bot's function-invocation cost.

## Default policy (in code, unchanged by this feature)

- **Welcomed for GEO:** GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot,
  Claude-User, Google-Extended, Applebot-Extended.
- **Disallowed by default in robots.txt** (polite only, *not* 403-enforced unless also added
  to `AI_BOTS_BLOCKED`): GoogleOther(+Image/Video), AhrefsBot, SemrushBot, MJ12bot, DotBot,
  DataForSeoBot, Baiduspider, Bytespider.

> Googlebot / Bingbot are never in these lists — never block your search crawlers.

## Monitoring

- **Vercel → Firewall**: per-bot request volume (allowed / denied) — the primary
  "who's hitting us" view. This is where you spot a single bot dominating cost.
- **Function logs**: grep `[crawler-block]` — one line per 403'd request
  (`{ bot, path }`). Low volume (only blocked hits), so it's a clean audit trail of
  what the switch is actually stopping.
- **Workflow**: Firewall shows a bot's volume → if one bot's cost dominates, add it to
  `AI_BOTS_BLOCKED` + redeploy → confirm via `[crawler-block]` logs and a drop in that
  bot's Firewall volume.

## Scope & limits

- This is **block / allow only**, not rate-limiting. True per-rate throttling (allow N
  requests/min, then slow) needs the durable limiter from the Part B **Phase 3** plan
  (Upstash) — see `docs/security-analytics-plan.md`.
- It's a **scalpel**: block **one** bot without touching the rest, reversibly, per site.
- Pairs with the caching plan (`docs/caching-plan.md`): caching cuts the cost of *welcome*
  crawlers; this switch removes *unwelcome* ones entirely.

## Reverting

Clear `AI_BOTS_BLOCKED` (or remove the one token) + redeploy. robots.txt and middleware
return to the default allow policy on the new deploy — no data migration, no code change.

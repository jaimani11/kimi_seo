# Marketing automation

Daily auto-posting to Pinterest, Instagram, and TikTok. Admin-controlled at
`/admin/marketing`. Vercel Cron triggers the daily run at 13:00 UTC.

## What it does

Once a day the scheduler:

1. Picks N cities per platform from `SEO_CITIES` using a deterministic
   day+platform-seeded rotation, so the content set is always fresh
   and every city eventually gets airtime.
2. Generates a `CitySocialPack` per city using the existing Sprint 14
   social-content engine (LLM via `ANTHROPIC_API_KEY` → template fallback).
3. Records a `MarketingPost` per slot.
4. Hands each post to the platform adapter (Pinterest / Instagram / TikTok).

Default targets (admin-editable):

- Pinterest — 20 posts/day
- Instagram — 20 posts/day
- TikTok — 10 posts/day (scripts; video upload is v2)

All three platforms default to `enabled: false`. Turn them on at
`/admin/marketing` after the credentials below are configured.

## Credentials — what to set in Vercel env

Each platform's adapter checks specific env vars at runtime. Without them,
it runs in **stub mode**: content still generates and persists; nothing is
posted to the platform.

### Pinterest

You need a **Pinterest Business account** and a developer app at
[developers.pinterest.com](https://developers.pinterest.com/).

| Env var                    | What it is                                    |
| -------------------------- | --------------------------------------------- |
| `PINTEREST_ACCESS_TOKEN`   | OAuth access token, scope `pins:write,boards:read` |
| `PINTEREST_BOARD_ID`       | The board to pin to (numeric ID, not name)    |

Steps:
1. Create a Pinterest Business account.
2. Create a developer app → set up an OAuth app.
3. Run the OAuth flow once to mint a long-lived access token. (Vercel
   doesn't refresh tokens for you; rotate manually or wire a refresh job.)
4. Note the board ID of the board you want pins to land on
   (URL or via Boards API).

### Instagram

You need an **Instagram Business** or **Creator account** connected to a
Facebook page, plus a Meta for Developers app.

| Env var                     | What it is                                       |
| --------------------------- | ------------------------------------------------ |
| `INSTAGRAM_ACCESS_TOKEN`    | Long-lived page access token (60-day, refreshable) |
| `INSTAGRAM_USER_ID`         | Instagram Business user id (not the @handle)     |

Steps:
1. Connect your Instagram account to a Facebook page (one-time, via the
   Instagram app or Meta Business Suite).
2. Create a Meta for Developers app with the **Instagram Graph API**
   permission requested + approved.
3. Mint a long-lived page access token via the Graph API Explorer
   (the short-lived → long-lived exchange).
4. Get your Instagram user id from
   `https://graph.facebook.com/v18.0/me?fields=instagram_business_account&access_token=…`.

### TikTok

You need a **TikTok for Developers** app with **Content Posting API**
access. App review can take days; without approval the adapter stays in
stub mode.

| Env var                  | What it is                                       |
| ------------------------ | ------------------------------------------------ |
| `TIKTOK_ACCESS_TOKEN`    | OAuth user access token, scope `video.publish`   |
| `TIKTOK_OPEN_ID`         | TikTok account open id                           |

> **TikTok caveat:** the v1 adapter generates a **script** (hook + scenes +
> hashtags + music cue), not a video. To direct-post you'd need a render
> pipeline (Pictory, Lumen5, an in-house ffmpeg renderer, etc.). For now,
> the scheduler logs the script; treat the queue as a "needs filming"
> list for a human or downstream agent.

### Cron secret

| Env var          | What it is                                                |
| ---------------- | --------------------------------------------------------- |
| `CRON_SECRET`    | Random string. Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`; the cron handler rejects anyone else. |

When unset, the cron endpoint is open — fine for local dev, **set it in
production**.

### Admin password gate (locks /admin/marketing)

`/admin/marketing` and its config / run-now API endpoints are hidden
behind a password gate so that anyone who guesses the URL can't change
your schedule.

| Env var                | What it is                                                |
| ---------------------- | --------------------------------------------------------- |
| `ADMIN_PASSWORD`       | The login password. **Without this set, the gate is OPEN.** |
| `ADMIN_SESSION_SECRET` | HMAC key for signing the 7-day session cookie. 32+ ASCII chars. If unset, a process-local random key is generated each boot — sessions invalidate on restart. |

**To set up:**

1. In Vercel → Settings → Environment Variables, add `ADMIN_PASSWORD`
   with a strong value of your choice. Start with
   `change-me-immediately-2026`, then rotate it once you've logged in.
2. Add `ADMIN_SESSION_SECRET` with a random 32+ character string.
   You can generate one in your terminal with:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Redeploy (Vercel does this automatically when env vars change).
4. Visit `gotript.com/admin/marketing` → you'll be redirected to
   `/admin/login`. Enter the password to access the dashboard.

**To rotate the password:** change `ADMIN_PASSWORD` in Vercel env →
redeploy → next time you visit `/admin/marketing`, you'll get the
login screen again. Existing session cookies are invalidated when
`ADMIN_SESSION_SECRET` rotates; if you only change `ADMIN_PASSWORD`,
existing logged-in sessions stay valid until they expire (7 days).
Rotate both at once for a hard logout.

## Admin UI — `/admin/marketing`

- **Schedule controls** — per-platform on/off + daily count. Saves to the
  in-memory store (Postgres mirror is wired the same way as funnel events;
  not yet implemented for marketing). After "Save schedule" the next cron
  run picks it up.
- **Live / Stub badges** — green when all required env vars for that
  platform are set, gray otherwise.
- **Run all platforms now** — manual trigger that ignores the `enabled`
  flag so an operator can preview a batch without flipping the switch.
- **Run {Platform} now** — same as above but scoped to one platform.
- **Recent posts** — most-recent-first table; click the headline to see
  the generated payload.

## Cron schedule

`vercel.json` ships with:

```json
{
  "crons": [
    { "path": "/api/cron/marketing-daily", "schedule": "0 13 * * *" }
  ]
}
```

That's 13:00 UTC daily (≈ 09:00 ET). Tune the cron expression for your
audience time zone or to spread posts across the day (you can add more
`crons` entries with `?platform=pinterest` etc.).

## Storage

The current store is in-memory. On Vercel that means each serverless
function instance has its own copy — the cron handler's in-memory log
won't be visible to the admin page on a different instance. To make this
production-grade you'd add a `PostgresMarketingStore` mirroring the
`InMemoryMarketingStore` interface and flip `getMarketingStore()` to
return it when `DATABASE_URL` is set. Same pattern as the session-store
factory.

For v1, the admin page reads from in-memory and refreshes on a manual
run — good enough to verify the pipeline; persistent history is the
follow-up.

## Cost notes

- Each post triggers one LLM-backed `generateCitySocialPack` call when
  `ANTHROPIC_API_KEY` is set. The scheduler dedupes generations per
  city per run — Pinterest + Instagram for the same city = one LLM call.
- TikTok packs are generated once per city per run.
- 50 cities × 1 pack each × Anthropic Haiku 4.5 (~$0.001/1K tokens × ~3K
  tokens per pack) ≈ ~$0.15/day. Bumping `dailyCount` past
  `SEO_CITIES.length` doesn't add cost — the pack is cached within the
  run.

## Roadmap

- v2: Real platform-API integration (the adapter `post()` bodies are
  the only files to touch).
- v2.1: Postgres persistence + cross-instance visibility.
- v2.2: Per-post review queue with admin approve/reject before live posting.
- v3: Video rendering pipeline for TikTok / Reels.

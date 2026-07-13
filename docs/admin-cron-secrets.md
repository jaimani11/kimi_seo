# Admin & Cron Secrets

Reference for the operator secrets that gate the admin surfaces and cron
jobs across all four apps (numiworks · gotript · gobookt · stayviaowner).
**No secret values live in this file** — set them per project in Vercel.

All three are **server-only** — never prefix any of them with `NEXT_PUBLIC_`
(that would ship the value in the browser bundle).

| Secret | Consumed by | Required? | If **missing** | Vercel envs | Redeploy after change? |
|---|---|---|---|---|---|
| `ADMIN_PASSWORD` | `lib/admin/password-session.ts` → `/api/admin/login` + the `requirePasswordAdmin()` gate on password-gated admin pages (marketing, social/Pinterest) | **Yes in production** | **Gate is OPEN** — password-gated admin pages become reachable with no password (the hidden login page also disables itself). A production security hole. | Production + Preview | Yes |
| `ADMIN_SESSION_SECRET` | `lib/admin/password-session.ts` — HMAC key that signs the `<brand>_admin` session cookie | **Strongly recommended in production** | Falls back to a **process-local random key** → admin sessions **invalidate on every restart/deploy** (you get logged out). If set but < 16 chars: works, logs a warning. Never silently ignored. | Production + Preview | Yes — and note changing it **logs out existing admin sessions** |
| `CRON_SECRET` | `/api/cron/marketing-daily` + `/api/cron/marketing-catchup` — verifies `authorization: Bearer <CRON_SECRET>` | **Yes in production** | `isAuthorized()` returns `true` → **the cron endpoints are publicly callable** (anyone could trigger the daily/catchup marketing run). Intentionally open for local dev only. | Production (crons run in prod; Preview optional) | Yes |

## Notes

- **Scope:** these apply identically in **all four apps** — each Vercel project needs its own copy (project env vars don't cross projects).
- **Generating values:** for `ADMIN_SESSION_SECRET` and `CRON_SECRET`, use a long random value, e.g. `openssl rand -hex 32`. `ADMIN_PASSWORD` is your chosen operator password.
- **Vercel Cron header:** the scheduled job must send `Authorization: Bearer <CRON_SECRET>`. Configure this on the cron definition so production crons authenticate while the public internet cannot trigger them.
- **Redeploy rule:** environment-variable changes in Vercel **do not affect existing deployments** — always redeploy after adding or changing any of these.

## Priority

If you set only one thing today: **`ADMIN_PASSWORD` in production on every project** (closes the open-admin hole), then `CRON_SECRET` (closes the open-cron endpoints), then `ADMIN_SESSION_SECRET` (makes admin logins survive deploys).

## Out of scope (broader secret inventory)

The wider set — `DATABASE_URL`, `CLERK_*`, `STRIPE_*`, `ANTHROPIC_API_KEY`,
`LANGFUSE_*`, and the affiliate vars — is tracked in the Part B plan
(Phase 1 env hygiene + Phase 4 documentation). This file covers only the
admin/cron gate secrets flagged as undocumented.

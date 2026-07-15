# ⚠️ Unmounted dead code — do not build on this

The `features/workspace/` subsystem (AI concierge chat, trip-board canvas,
detail/marketplace drawers, provenance badges) is **fork leftover from
numiworks and is not mounted by any route** in stayviaowner. No file under
`src/app/` imports `features/workspace/*`, and `Workspace` has zero external
importers — so none of this renders at any URL.

**Do not wire it live without an explicit product decision.** stayviaowner is a
Vrbo whole-home **rental** brand; its live surface is the static marketing
homepage + programmatic SEO pages + the `/rentals/*` matrix. **numiworks is the
AI-concierge brand** — build planner/concierge work there, not here.

If this subsystem is ever mounted, note that the stay CTAs already default to
Vrbo (see `lib/affiliate/active-stay-provider.ts` → `vrbo`), so it is at least
on-brand — but it has not been reviewed for the reposition.

Kept (not deleted) only to avoid a large, risky diff. Safe to delete wholesale
once confirmed no future feature intends to revive it.

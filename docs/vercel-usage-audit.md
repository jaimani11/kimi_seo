# Vercel Usage & Cost Audit — adored-moments-platform

**Date:** 2026-07-13
**Status:** **IN PROGRESS — cost not yet concluded.** Per the agreed method, this does **not** declare usage "safe" until the Billing figure in §5 is filled in. It states only what the observed signal supports, and lists the exact numbers needed to finish.

---

## 1. What Vercel Pro actually bills for

- Pro plan: a base fee **plus** a monthly included allotment of each metered resource — **Function Invocations, Function Duration (GB-hours), Edge Requests, Fast Data Transfer, ISR/Data-Cache reads & writes.** Anything above the allotment is billed per unit (overage).
- **Cache HITS on static/ISR pages do NOT count as function invocations** — they're the (far cheaper) Edge Request. **Function INVOCATIONS** (dynamic page renders, API routes, middleware) are the expensive unit.
- So: a crawler hitting a **dynamic** page = **1 function invocation**. A crawler hitting a **cached** page = **1 edge request**, not an invocation. Same crawler, ~10× cost difference depending on which side of that line the route sits.

## 2. Observed signal (from the Usage + Firewall views so far)

- **Traffic is crawler-dominated.** Firewall (past hour): gotript **138 allowed / 1 denied**, stayviaowner **17 allowed / 4 denied**. ClaudeBot alone was ~**26k** over an earlier reviewed window. **Bot Protection is Inactive** on the projects checked — so bots pass through to the app, i.e. they generate invocations.
- **A spike on Jul 12** (since subsided) — a burst, not steady state. Don't size the month off the spike day.
- **Pages render 0%-cached at the page level.** The root layout reads cookies/headers (session, theme, the apex→www host redirect) → every page is **dynamic** → **every crawler pageview is a function invocation.** This is the structural cost driver.

## 3. What that means (structural — not yet costed)

- With 0%-cache + crawler-scale pageviews, **invocations scale with crawl volume, not human traffic.** That is the lever to pull.
- The fix is **route-by-route caching** (the item-5 plan): make the indexable, non-personalized long tail — destination guides, things-to-do, attraction pages, `/sitemap*`, `/robots`, `/llms.txt` — **static or ISR**, so a crawler hit becomes a **cache hit (edge request)** instead of an invocation. Keep personalized / auth / affiliate-redirect / live-price routes dynamic.
- The savings live in the crawler-facing static long tail. Blocking crawlers is **not** required (and you've chosen to keep GEO reach) — caching gets the cost down without touching reach.

## 4. What CANNOT be concluded yet

- Whether current usage **exceeds the included allotment at all** (i.e. whether there is *any* overage $).
- **Projected month-end cost.**
- **Per-route invocation share** (which routes dominate).

No "it's fine" verdict is issued until §5 is filled. That's deliberate.

## 5. The numbers that complete this audit — read these off Vercel

Walk these three places and note the value next to each. This is the "walk the Usage tab" pass.

**A. Settings → Billing** (the decisive one)
1. **Estimated cost this cycle:** $ `____`
2. **Billing-cycle dates:** `____` to `____`  ·  today is day `__` of `__`
3. **Any line item shown as overage** (which resource + $): `____`

**B. Usage tab** (set the range to **"Billing Cycle"**) — for **each** of the 4 projects, and the account total:
4. **Function Invocations:** used `____` / included `____`  (= `__`% of allotment)
5. **Function Duration (GB-Hrs):** used `____` / included `____`
6. **Edge Requests:** used `____` / included `____`
7. **ISR / Data-Cache** reads + writes (if shown): `____`
8. **Fast Data Transfer:** used `____` / included `____`

**C. Usage → Functions** (if your plan exposes it): top ~10 routes by invocation, and top user-agents. This tells us exactly which routes to cache first.

## 6. Cost model (resolves once §5 is known)

```
projected_cycle_cost ≈ estimated_cost_this_cycle × (cycle_length_days ÷ days_elapsed)
overage(resource)     = max(0, used − included) × unit_overage_price
```
If **invocations** are the dominant overage **and** crawler share is high (both currently indicated), the item-5 caching plan cuts the dominant term directly.

## 7. Recommendation (holds regardless of the number)

- **Keep GEO reach** — crawlers stay allowed (your call). The remedy is **caching, not blocking**.
- **Proceed with the route-by-route caching plan** as the structural fix — it lowers invocation cost without touching crawler reach or affiliate attribution.
- **Add AI-crawler monitoring + a reversible per-bot switch** so that if a *single* bot's cost ever dominates, you can throttle just that one — a scalpel, not the current all-or-nothing.

> Fill in §5 (even just item 1 — the estimated cost) and this audit converts from "structural analysis" to a costed verdict with a concrete savings estimate.

/**
 * Analytics client. Platform-agnostic seam — picks the right backend
 * based on which env var is set at render time.
 *
 *   - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`    → Plausible (lightweight, cookieless)
 *   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`   → Google Analytics 4
 *   - neither set                       → no-op for external platforms
 *
 * In addition, a small allowlist of "funnel events" (Sprint 17) gets
 * POST'd to `/api/analytics/event` so the admin /admin/analytics
 * dashboard can show exact counts independently of Plausible/GA4.
 *
 * Both backends silently no-op until their `<AnalyticsScript>` has
 * hydrated, so `track()` is safe to call during page loads — events
 * sent before the script loads queue and flush automatically (Plausible
 * via its own queue, GA4 via `gtag('event', ...)` which dataLayer-
 * buffers).
 *
 * Browser-only — call from `'use client'` components.
 */

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

interface PlausibleFn {
  (event: string, options?: { props?: AnalyticsProps }): void;
}

interface GtagFn {
  (command: 'event', eventName: string, params?: AnalyticsProps): void;
}

declare global {
  interface Window {
    plausible?: PlausibleFn;
    gtag?: GtagFn;
  }
}

/**
 * Funnel events that get persisted in the session store too. Kept in
 * sync with FUNNEL_EVENT_KINDS in lib/session/session-store.ts. The
 * duplicated constant avoids a server-only module from leaking into
 * the client bundle.
 */
const FUNNEL_EVENT_NAMES = new Set<string>([
  'search_results_view',
  'recommendation_impression',
  'experience_view',
  'save_click',
]);

export function track(event: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;
  const cleaned = pruneUndefined(props);
  try {
    if (typeof window.plausible === 'function') {
      window.plausible(event, cleaned ? { props: cleaned } : undefined);
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, cleaned ?? undefined);
    }
  } catch {
    // Never crash a UI surface for an analytics failure.
  }
  // Persist funnel events so the admin dashboard can show exact
  // counts. Best-effort — we never await or surface failures.
  if (FUNNEL_EVENT_NAMES.has(event)) {
    void postFunnelEvent(event, cleaned);
  }
}

function postFunnelEvent(kind: string, props?: AnalyticsProps): Promise<void> {
  const ref = typeof props?.ref === 'string' ? props.ref : undefined;
  // Forward everything except `ref` as structured metadata. The API
  // re-validates with its own bounded schema. Sprint 18 uses this so
  // experience_view can carry {title, imageUrl, destination, priceFromUsd}
  // and the "Pick up where you left off" rail can render without a
  // second round-trip to Viator.
  const metadata = extractMetadata(props);
  // `keepalive: true` lets the request finish even when the user
  // navigates away mid-call (the common case for view-tracking).
  return fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      ...(ref ? { ref } : {}),
      ...(metadata ? { metadata } : {}),
    }),
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

function extractMetadata(
  props?: AnalyticsProps,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k === 'ref') continue;
    if (v === undefined) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function pruneUndefined(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const entries = Object.entries(props).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as AnalyticsProps;
}

import type { FunnelEventRecord } from '@lib/session/session-store';

/**
 * Sprint 18 — server-side selector that turns the funnel event log
 * into the "Pick up where you left off" rail.
 *
 * Pure function over an array of FunnelEventRecord, so it's trivially
 * testable. The caller is responsible for pre-filtering events to one
 * session (via `session.listEvents({ sessionId, ... })`) — we don't
 * re-filter here because doing so would require knowing the rail's
 * scope (session-only vs. cross-device-for-user), which lives at the
 * call site.
 */

export interface RecentlyViewedItem {
  productCode: string;
  title: string;
  imageUrl: string;
  destination: string;
  priceFromUsd: number | null;
  currency: string;
  viewedAt: string;
}

/**
 * Reduce raw `experience_view` events into a deduped, most-recent-first
 * list of items.
 *
 *   - Dedupes by `productCode` (event.ref). When the same code appears
 *     twice, the most recent view wins (later events overwrite earlier
 *     snapshots — titles + prices may change between visits).
 *   - Skips events without a productCode or without a usable title in
 *     metadata. An `experience_view` event written before Sprint 18
 *     (no metadata) is silently ignored rather than rendered as a
 *     placeholder card.
 *   - Returns at most `limit` items (default 8).
 */
export function recentlyViewedFromEvents(
  events: readonly FunnelEventRecord[],
  limit = 8,
): RecentlyViewedItem[] {
  const byCode = new Map<string, RecentlyViewedItem>();
  // Walk most-recent-first so the FIRST occurrence of each productCode
  // wins. Inserting into a Map preserves insertion order, which is
  // exactly the order we want to render.
  const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const e of sorted) {
    if (e.kind !== 'experience_view') continue;
    const productCode = e.ref;
    if (!productCode) continue;
    if (byCode.has(productCode)) continue;
    const item = toItem(e, productCode);
    if (!item) continue;
    byCode.set(productCode, item);
    if (byCode.size >= limit) break;
  }
  return Array.from(byCode.values());
}

function toItem(
  e: FunnelEventRecord,
  productCode: string,
): RecentlyViewedItem | null {
  const m = e.metadata;
  if (!m) return null;
  const title = stringField(m.title);
  if (!title) return null;
  const imageUrl = stringField(m.imageUrl);
  const destination = stringField(m.destination) ?? '';
  const currency = stringField(m.currency) ?? 'USD';
  const priceFromUsd = numberField(m.priceFromUsd);
  return {
    productCode,
    title,
    imageUrl: imageUrl ?? '',
    destination,
    priceFromUsd: priceFromUsd && priceFromUsd > 0 ? priceFromUsd : null,
    currency,
    viewedAt: e.createdAt,
  };
}

function stringField(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function numberField(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

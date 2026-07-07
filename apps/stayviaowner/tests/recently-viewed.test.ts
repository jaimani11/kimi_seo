import { describe, expect, it } from 'vitest';
import { recentlyViewedFromEvents } from '../src/lib/analytics/recently-viewed';
import type { FunnelEventRecord } from '../src/lib/session/session-store';

function event(
  partial: Partial<FunnelEventRecord> & { createdAt: string },
): FunnelEventRecord {
  return {
    id: partial.id ?? `evt_${partial.createdAt}_${partial.ref ?? 'x'}`,
    kind: partial.kind ?? 'experience_view',
    ownerKind: partial.ownerKind ?? 'session',
    ownerId: partial.ownerId ?? 'anon_1',
    sessionId: partial.sessionId ?? 'sess_1',
    ...(partial.ref !== undefined ? { ref: partial.ref } : {}),
    ...(partial.metadata !== undefined ? { metadata: partial.metadata } : {}),
    createdAt: partial.createdAt,
  };
}

describe('recentlyViewedFromEvents', () => {
  it('returns empty when no events', () => {
    expect(recentlyViewedFromEvents([])).toEqual([]);
  });

  it('extracts a single viewed experience with full metadata', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: 'TOK-001',
        createdAt: '2026-06-12T10:00:00Z',
        metadata: {
          title: 'Senso-ji Temple at Sunrise',
          imageUrl: 'https://cdn.example/sensoji.jpg',
          destination: 'Tokyo',
          priceFromUsd: 18,
          currency: 'USD',
        },
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productCode: 'TOK-001',
      title: 'Senso-ji Temple at Sunrise',
      destination: 'Tokyo',
      priceFromUsd: 18,
      currency: 'USD',
    });
  });

  it('dedupes by productCode, most-recent wins', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: 'TOK-001',
        createdAt: '2026-06-12T09:00:00Z',
        metadata: { title: 'Old title', imageUrl: '', currency: 'USD' },
      }),
      event({
        ref: 'TOK-001',
        createdAt: '2026-06-12T11:00:00Z',
        metadata: { title: 'New title', imageUrl: '', currency: 'USD' },
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('New title');
  });

  it('orders distinct items most-recent-first', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: 'A',
        createdAt: '2026-06-12T09:00:00Z',
        metadata: { title: 'A', imageUrl: '', currency: 'USD' },
      }),
      event({
        ref: 'B',
        createdAt: '2026-06-12T10:00:00Z',
        metadata: { title: 'B', imageUrl: '', currency: 'USD' },
      }),
      event({
        ref: 'C',
        createdAt: '2026-06-12T11:00:00Z',
        metadata: { title: 'C', imageUrl: '', currency: 'USD' },
      }),
    ]);
    expect(items.map((i) => i.productCode)).toEqual(['C', 'B', 'A']);
  });

  it('respects limit', () => {
    const events: FunnelEventRecord[] = [];
    for (let i = 0; i < 12; i += 1) {
      events.push(
        event({
          ref: `code-${i}`,
          createdAt: `2026-06-12T${String(10 + i).padStart(2, '0')}:00:00Z`,
          metadata: { title: `Title ${i}`, imageUrl: '', currency: 'USD' },
        }),
      );
    }
    expect(recentlyViewedFromEvents(events, 5)).toHaveLength(5);
  });

  it('skips events without a productCode (ref)', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: undefined,
        createdAt: '2026-06-12T10:00:00Z',
        metadata: { title: 'No code', imageUrl: '', currency: 'USD' },
      }),
      event({
        ref: 'OK',
        createdAt: '2026-06-12T11:00:00Z',
        metadata: { title: 'Has code', imageUrl: '', currency: 'USD' },
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]!.productCode).toBe('OK');
  });

  it('skips events without metadata (pre-Sprint-18 data)', () => {
    const items = recentlyViewedFromEvents([
      event({ ref: 'OLD', createdAt: '2026-06-12T10:00:00Z' }),
    ]);
    expect(items).toEqual([]);
  });

  it('skips events without a title in metadata', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: 'NO-TITLE',
        createdAt: '2026-06-12T10:00:00Z',
        metadata: { imageUrl: 'x', currency: 'USD' },
      }),
    ]);
    expect(items).toEqual([]);
  });

  it('treats priceFromUsd of 0 as missing (non-USD currency case)', () => {
    const items = recentlyViewedFromEvents([
      event({
        ref: 'EU-1',
        createdAt: '2026-06-12T10:00:00Z',
        metadata: {
          title: 'Euro tour',
          imageUrl: '',
          destination: 'Rome',
          priceFromUsd: 0,
          currency: 'EUR',
        },
      }),
    ]);
    expect(items[0]!.priceFromUsd).toBeNull();
    expect(items[0]!.currency).toBe('EUR');
  });

  it('ignores non-experience_view events even if same shape', () => {
    const items = recentlyViewedFromEvents([
      event({
        kind: 'save_click',
        ref: 'SAVED',
        createdAt: '2026-06-12T10:00:00Z',
        metadata: { title: 'Saved thing', imageUrl: '', currency: 'USD' },
      }),
    ]);
    expect(items).toEqual([]);
  });
});

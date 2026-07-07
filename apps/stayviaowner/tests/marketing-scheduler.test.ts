import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMarketingScheduler } from '../src/lib/marketing/scheduler';
import {
  _resetMarketingStore,
  getMarketingStore,
} from '../src/lib/marketing/marketing-store';
import { _resetMarketingAdapters } from '../src/lib/marketing/adapters';
import { DEFAULT_MARKETING_CONFIG } from '../src/lib/marketing/types';

const ENV_KEYS = [
  'PINTEREST_ACCESS_TOKEN',
  'PINTEREST_BOARD_ID',
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_USER_ID',
  'TIKTOK_ACCESS_TOKEN',
  'TIKTOK_OPEN_ID',
  'ANTHROPIC_API_KEY',
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  _resetMarketingStore();
  _resetMarketingAdapters();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('runMarketingScheduler', () => {
  it('skips disabled platforms when forceRun is false', async () => {
    // Default config has all enabled=false.
    const summary = await runMarketingScheduler({ dayKey: '2026-06-13' });
    expect(summary.totals.attempted).toBe(0);
    expect(summary.perPlatform.pinterest.attempted).toBe(0);
    expect(summary.perPlatform.instagram.attempted).toBe(0);
    expect(summary.perPlatform.tiktok.attempted).toBe(0);
  });

  it('forceRun executes platforms with dailyCount > 0 even if disabled', async () => {
    const summary = await runMarketingScheduler({
      dayKey: '2026-06-13',
      forceRun: true,
    });
    expect(summary.totals.attempted).toBeGreaterThan(0);
  });

  it('every platform attempts dailyCount records in stub mode', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 3 },
      instagram: { enabled: true, dailyCount: 3 },
      tiktok: { enabled: true, dailyCount: 2 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });
    const summary = await runMarketingScheduler({ dayKey: '2026-06-13' });
    expect(summary.perPlatform.pinterest.attempted).toBe(3);
    expect(summary.perPlatform.instagram.attempted).toBe(3);
    expect(summary.perPlatform.tiktok.attempted).toBe(2);
    expect(summary.totals.posted).toBe(8);
    expect(summary.totals.failed).toBe(0);
  });

  it('persists every attempted post', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 2 },
      instagram: { enabled: false, dailyCount: 0 },
      tiktok: { enabled: false, dailyCount: 0 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });
    await runMarketingScheduler({ dayKey: '2026-06-13' });
    const all = await store.listPosts({});
    expect(all).toHaveLength(2);
    expect(all.every((p) => p.platform === 'pinterest')).toBe(true);
    expect(all.every((p) => p.status === 'posted')).toBe(true);
  });

  it('runs are idempotent within a day for the same dayKey', async () => {
    // Same day same platform → same cities picked. Posts accumulate
    // across runs (no dedup on the store side); the rotation order
    // is what we verify.
    const cfg = {
      pinterest: { enabled: true, dailyCount: 5 },
      instagram: { enabled: false, dailyCount: 0 },
      tiktok: { enabled: false, dailyCount: 0 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    };
    await getMarketingStore().putConfig(cfg);
    await runMarketingScheduler({ dayKey: '2026-06-13' });
    const cities1 = (
      await getMarketingStore().listPosts({ platform: 'pinterest' })
    ).map((p) => p.citySlug);

    _resetMarketingStore();
    _resetMarketingAdapters();
    await getMarketingStore().putConfig(cfg);
    await runMarketingScheduler({ dayKey: '2026-06-13' });
    const cities2 = (
      await getMarketingStore().listPosts({ platform: 'pinterest' })
    ).map((p) => p.citySlug);

    expect(new Set(cities1)).toEqual(new Set(cities2));
  });

  it('onlyPlatform restricts the run to a single platform', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 3 },
      instagram: { enabled: true, dailyCount: 3 },
      tiktok: { enabled: true, dailyCount: 3 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });
    const summary = await runMarketingScheduler({
      dayKey: '2026-06-13',
      onlyPlatform: 'instagram',
    });
    expect(summary.perPlatform.pinterest.attempted).toBe(0);
    expect(summary.perPlatform.instagram.attempted).toBe(3);
    expect(summary.perPlatform.tiktok.attempted).toBe(0);
  });

  it('reports stub-vs-live mode via the adapter status (default = stub)', async () => {
    // Adapters are constructed lazily — verify they pick up the lack
    // of env vars when first instantiated by the scheduler.
    const summary = await runMarketingScheduler({
      dayKey: '2026-06-13',
      forceRun: true,
    });
    // Stub mode succeeds (it just logs), so posted should equal
    // attempted. The "mode" doesn't show up in the summary — we
    // verify via the store's externalUrl instead.
    expect(summary.totals.posted).toBe(summary.totals.attempted);
    const stored = await getMarketingStore().listPosts({});
    for (const p of stored) {
      expect(p.externalUrl).toMatch(/^(pinterest|instagram|tiktok):\/\/stub/);
    }
  });

  it('default config is sane: 20/20/10 with all disabled', () => {
    expect(DEFAULT_MARKETING_CONFIG.pinterest.dailyCount).toBe(20);
    expect(DEFAULT_MARKETING_CONFIG.instagram.dailyCount).toBe(20);
    expect(DEFAULT_MARKETING_CONFIG.tiktok.dailyCount).toBe(10);
    expect(DEFAULT_MARKETING_CONFIG.pinterest.enabled).toBe(false);
    expect(DEFAULT_MARKETING_CONFIG.instagram.enabled).toBe(false);
    expect(DEFAULT_MARKETING_CONFIG.tiktok.enabled).toBe(false);
  });

  it('every posted CTA references gotript.com with a platform-scoped UTM', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 3 },
      instagram: { enabled: true, dailyCount: 3 },
      tiktok: { enabled: true, dailyCount: 2 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });
    await runMarketingScheduler({ dayKey: '2026-06-13' });
    const all = await store.listPosts({});
    for (const post of all) {
      const cta = (post.payload as { cta?: string }).cta ?? '';
      expect(cta).toContain('gotript.com');
      expect(cta).toContain(`utm_source=${post.platform}`);
      expect(cta).toContain('utm_medium=organic');
      expect(cta).toContain(`utm_campaign=daily-${post.citySlug}`);
    }
  });

  it('respects a 2-day cooldown so the same city doesn’t repeat consecutively per platform', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 10 },
      instagram: { enabled: false, dailyCount: 0 },
      tiktok: { enabled: false, dailyCount: 0 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });

    await runMarketingScheduler({ dayKey: '2026-06-13' });
    const day1 = (await store.listPosts({ platform: 'pinterest' })).map(
      (p) => p.citySlug,
    );
    await runMarketingScheduler({ dayKey: '2026-06-14' });
    const allAfterDay2 = await store.listPosts({ platform: 'pinterest' });
    const day2 = allAfterDay2
      .filter((p) => p.createdAt > day1[0]!)
      .map((p) => p.citySlug);

    // Day 2 must not repeat any city from day 1.
    const overlap = day2.filter((s) => day1.includes(s));
    expect(overlap).toEqual([]);
  });

  it('picks a different pack item when the same city cycles back', async () => {
    const store = getMarketingStore();
    await store.putConfig({
      pinterest: { enabled: true, dailyCount: 15 },
      instagram: { enabled: false, dailyCount: 0 },
      tiktok: { enabled: false, dailyCount: 0 },
      updatedAt: '2026-06-13T00:00:00.000Z',
    });

    // Run 30 days of rotation. With dailyCount=15 and the 2-day
    // cooldown some city will definitely have been posted at least
    // twice — verify it's not the same headline both times.
    for (let d = 1; d <= 30; d++) {
      const dayKey = `2026-06-${String(d).padStart(2, '0')}`;
      await runMarketingScheduler({ dayKey });
    }
    const all = await store.listPosts({ platform: 'pinterest', limit: 9999 });

    // Group by city slug, find one that repeated, assert headlines
    // differ across its repeats.
    const bySlug = new Map<string, string[]>();
    for (const p of all) {
      const pl = p.payload as { title?: string; hook?: string };
      const headline = pl.title ?? pl.hook ?? '';
      const arr = bySlug.get(p.citySlug) ?? [];
      arr.push(headline);
      bySlug.set(p.citySlug, arr);
    }

    let foundRepeatCity = false;
    for (const headlines of bySlug.values()) {
      if (headlines.length < 2) continue;
      foundRepeatCity = true;
      const uniqueHeadlines = new Set(headlines);
      expect(uniqueHeadlines.size).toBeGreaterThan(1);
      break;
    }
    expect(foundRepeatCity).toBe(true);
  });
});

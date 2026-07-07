import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryWebhookEventStore } from '@/lib/billing/webhook-idempotency';

describe('InMemoryWebhookEventStore', () => {
  let log: InMemoryWebhookEventStore;

  beforeEach(() => {
    log = new InMemoryWebhookEventStore(/* cap */ 5);
  });

  it("first call returns 'new'", async () => {
    expect(await log.markProcessed('evt_1')).toBe('new');
  });

  it("second call with same id returns 'duplicate'", async () => {
    await log.markProcessed('evt_1');
    expect(await log.markProcessed('evt_1')).toBe('duplicate');
  });

  it("different ids each return 'new'", async () => {
    expect(await log.markProcessed('evt_a')).toBe('new');
    expect(await log.markProcessed('evt_b')).toBe('new');
    expect(await log.markProcessed('evt_c')).toBe('new');
  });

  it('cap evicts the oldest entry', async () => {
    for (let i = 0; i < 5; i += 1) {
      await log.markProcessed(`evt_${i}`);
    }
    // Sixth insert evicts evt_0.
    await log.markProcessed('evt_5');
    expect(await log.markProcessed('evt_0')).toBe('new'); // can be re-recorded
    expect(await log.markProcessed('evt_5')).toBe('duplicate');
  });

  it('concurrent same-id calls: only one returns new', async () => {
    const results = await Promise.all([
      log.markProcessed('evt_concurrent'),
      log.markProcessed('evt_concurrent'),
      log.markProcessed('evt_concurrent'),
    ]);
    const newCount = results.filter((r) => r === 'new').length;
    expect(newCount).toBe(1);
  });
});

/**
 * Webhook idempotency log.
 *
 * Stripe retries deliveries aggressively on any non-2xx response, and
 * occasionally double-delivers on flaky network. Every event has a
 * stable `event.id` we can dedupe on. `markProcessed(id)` is the
 * atomic check-and-set: first call returns `'new'`, subsequent calls
 * return `'duplicate'`. Callers must short-circuit on `'duplicate'`
 * without re-applying state mutations.
 *
 * In-memory impl is mock-safe. Postgres-backed impl (using a primary
 * key on event.id for true atomicity) lands in C4.x via `WebhookEvent`
 * in `prisma/schema.prisma`.
 */
export interface WebhookEventStore {
  markProcessed(eventId: string): Promise<'new' | 'duplicate'>;
}

export class InMemoryWebhookEventStore implements WebhookEventStore {
  private readonly seen = new Map<string, number>(); // eventId → insertion order
  private order = 0;
  constructor(private readonly cap = 1000) {}

  async markProcessed(eventId: string): Promise<'new' | 'duplicate'> {
    if (this.seen.has(eventId)) return 'duplicate';
    this.seen.set(eventId, this.order++);
    if (this.seen.size > this.cap) {
      // Evict the oldest entry - bounded memory in long-running dev.
      const oldest = [...this.seen.entries()].sort(([, a], [, b]) => a - b)[0];
      if (oldest) this.seen.delete(oldest[0]);
    }
    return 'new';
  }

  /** Test-only - wipe state. */
  _reset(): void {
    this.seen.clear();
    this.order = 0;
  }
}

declare global {
  var __stayscoutWebhookEventStore: InMemoryWebhookEventStore | undefined;
}

export function getInMemoryWebhookEventStore(): InMemoryWebhookEventStore {
  if (!globalThis.__stayscoutWebhookEventStore) {
    globalThis.__stayscoutWebhookEventStore = new InMemoryWebhookEventStore();
  }
  return globalThis.__stayscoutWebhookEventStore;
}

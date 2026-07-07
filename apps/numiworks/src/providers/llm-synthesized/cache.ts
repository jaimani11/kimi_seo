/**
 * Simple TTL-bounded cache keyed by string. Slice A in-memory; Slice B
 * swaps to Redis via the same shape behind a SessionStore-like interface.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();
  constructor(private readonly ttlMs: number) {}

  get(key: string): V | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.entries.clear();
  }
}

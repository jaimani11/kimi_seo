/**
 * Bounded in-memory cache with per-entry TTL. Used by real providers to
 * skip redundant API calls within an availability window.
 *
 * Implementation notes:
 *   - LRU eviction via a doubly-linked-list / Map combination would be
 *     more efficient, but for the size we run (<= ~1000 entries per
 *     provider) a plain Map + insertion-order semantics is enough.
 *     `Map` iteration order IS insertion order; on get-hit we delete +
 *     re-insert to bump the entry to "most recent."
 *   - TTL is checked lazily on `get` - expired entries return null +
 *     are deleted, no background sweeper needed.
 */
export interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class LRUCache<K, V> {
  private readonly map = new Map<K, CacheEntry<V>>();

  constructor(private readonly max: number = 500) {
    if (max < 1) throw new Error('LRUCache max must be >= 1');
  }

  get(key: K): V | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    // Bump to most-recent.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    if (ttlMs <= 0) return; // Caller asked for "don't cache" - silently no-op.
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (this.map.size > this.max) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey === undefined) break;
      this.map.delete(oldestKey);
    }
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

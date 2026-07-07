import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LRUCache } from '@/providers/_shared/cache';

describe('LRUCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for unknown key', () => {
    const c = new LRUCache<string, string>();
    expect(c.get('missing')).toBeNull();
  });

  it('round-trips a value within TTL', () => {
    const c = new LRUCache<string, string>();
    c.set('k', 'v', 1000);
    expect(c.get('k')).toBe('v');
  });

  it('expires entries past TTL', () => {
    const c = new LRUCache<string, string>();
    c.set('k', 'v', 100);
    vi.advanceTimersByTime(101);
    expect(c.get('k')).toBeNull();
  });

  it('evicts least-recently-used when full', () => {
    const c = new LRUCache<string, string>(2);
    c.set('a', '1', 10000);
    c.set('b', '2', 10000);
    c.set('c', '3', 10000); // evicts 'a'
    expect(c.get('a')).toBeNull();
    expect(c.get('b')).toBe('2');
    expect(c.get('c')).toBe('3');
  });

  it('counts a get-hit as recent (does not evict)', () => {
    const c = new LRUCache<string, string>(2);
    c.set('a', '1', 10000);
    c.set('b', '2', 10000);
    expect(c.get('a')).toBe('1'); // bumps 'a' to most-recent
    c.set('c', '3', 10000); // evicts 'b' (now LRU), not 'a'
    expect(c.get('a')).toBe('1');
    expect(c.get('b')).toBeNull();
  });

  it('treats ttlMs <= 0 as no-op', () => {
    const c = new LRUCache<string, string>();
    c.set('k', 'v', 0);
    expect(c.get('k')).toBeNull();
    expect(c.size).toBe(0);
  });

  it('overwrites an existing key (refreshes TTL + ordering)', () => {
    const c = new LRUCache<string, string>(2);
    c.set('a', 'first', 1000);
    vi.advanceTimersByTime(900);
    c.set('a', 'second', 1000); // refreshed
    vi.advanceTimersByTime(900);
    expect(c.get('a')).toBe('second'); // would have expired if we hadn't refreshed
  });

  it('delete removes the entry', () => {
    const c = new LRUCache<string, string>();
    c.set('k', 'v', 1000);
    expect(c.delete('k')).toBe(true);
    expect(c.get('k')).toBeNull();
    expect(c.delete('k')).toBe(false);
  });
});

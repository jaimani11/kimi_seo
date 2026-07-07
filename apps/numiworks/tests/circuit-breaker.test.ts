import { describe, expect, it } from 'vitest';
import { CircuitBreaker, CircuitBreakerOpenError } from '@/providers/_shared/circuit-breaker';

class FakeClock {
  constructor(private t = 1_000_000) {}
  now = (): number => this.t;
  advance(ms: number): void {
    this.t += ms;
  }
}

describe('CircuitBreaker', () => {
  it('passes through calls in closed state', async () => {
    const cb = new CircuitBreaker('p');
    const result = await cb.run(async () => 42);
    expect(result).toBe(42);
    expect(cb.getState()).toBe('closed');
  });

  it('opens after the failure threshold', async () => {
    const cb = new CircuitBreaker('p', { threshold: 3 });
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    }
    expect(cb.getState()).toBe('open');
  });

  it('rejects fast when open (no thunk invocation)', async () => {
    const clock = new FakeClock();
    const cb = new CircuitBreaker('p', { threshold: 1, cooldownMs: 1000, now: clock.now });
    await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(cb.getState()).toBe('open');

    let called = false;
    await expect(
      cb.run(async () => {
        called = true;
        return 'should-not-run';
      }),
    ).rejects.toThrow(CircuitBreakerOpenError);
    expect(called).toBe(false);
  });

  it('transitions to half-open after cooldown', async () => {
    const clock = new FakeClock();
    const cb = new CircuitBreaker('p', { threshold: 1, cooldownMs: 1000, now: clock.now });
    await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(cb.getState()).toBe('open');
    clock.advance(1001);
    expect(cb.getState()).toBe('half-open');
  });

  it('half-open success closes the breaker', async () => {
    const clock = new FakeClock();
    const cb = new CircuitBreaker('p', { threshold: 1, cooldownMs: 1000, now: clock.now });
    await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    clock.advance(1001);
    const result = await cb.run(async () => 'ok');
    expect(result).toBe('ok');
    expect(cb.getState()).toBe('closed');
  });

  it('half-open failure reopens with renewed cooldown', async () => {
    const clock = new FakeClock();
    const cb = new CircuitBreaker('p', { threshold: 1, cooldownMs: 1000, now: clock.now });
    await expect(cb.run(async () => Promise.reject(new Error('boom1')))).rejects.toThrow('boom1');
    clock.advance(1001);
    await expect(cb.run(async () => Promise.reject(new Error('boom2')))).rejects.toThrow('boom2');
    expect(cb.getState()).toBe('open');
    // Cooldown timer is renewed - still open after 999ms more.
    clock.advance(999);
    expect(cb.getState()).toBe('open');
    clock.advance(2);
    expect(cb.getState()).toBe('half-open');
  });

  it('a single success resets the consecutive-failure counter', async () => {
    const cb = new CircuitBreaker('p', { threshold: 3 });
    await expect(cb.run(async () => Promise.reject(new Error('a')))).rejects.toThrow('a');
    await expect(cb.run(async () => Promise.reject(new Error('b')))).rejects.toThrow('b');
    await cb.run(async () => 'ok'); // resets
    await expect(cb.run(async () => Promise.reject(new Error('c')))).rejects.toThrow('c');
    expect(cb.getState()).toBe('closed'); // only 1 consecutive failure now
  });
});

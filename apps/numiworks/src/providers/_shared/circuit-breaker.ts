/**
 * Per-provider circuit breaker. Three states + standard transitions:
 *
 *   closed     - calls pass through; consecutive failures count up
 *   open       - calls reject fast (no API hit); cooldown timer ticks
 *   half-open  - first call after cooldown is a trial; success → closed,
 *                failure → open with renewed cooldown
 *
 * Why per-instance (not global): a failing Booking.com mustn't suppress
 * Expedia. The breaker is held by `BaseAffiliateProvider` so each real
 * provider tracks its own health.
 *
 * Why a custom impl: standard Node circuit-breaker libs (opossum, etc.)
 * are heavyweight and pull in event-emitter + metrics machinery we
 * don't need. The state machine is small enough to own.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Consecutive failures before opening. Default 5. */
  threshold?: number;
  /** Cooldown ms before transitioning to half-open. Default 30s. */
  cooldownMs?: number;
  /** Optional clock override for tests. Returns ms-since-epoch. */
  now?: () => number;
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly providerId: string) {
    super(`circuit breaker open for ${providerId}`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(
    private readonly providerId: string,
    opts: CircuitBreakerOptions = {},
  ) {
    this.threshold = opts.threshold ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    this.now = opts.now ?? (() => Date.now());
  }

  /**
   * Wrap a thunk. When closed: invoke + record outcome. When open:
   * reject fast with `CircuitBreakerOpenError`. When half-open: invoke
   * once as a trial; outcome decides next state.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransitionToHalfOpen();
    if (this.state === 'open') {
      throw new CircuitBreakerOpenError(this.providerId);
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  /** Diagnostic - current state. */
  getState(): CircuitState {
    this.maybeTransitionToHalfOpen();
    return this.state;
  }

  private maybeTransitionToHalfOpen(): void {
    if (this.state !== 'open') return;
    if (this.now() - this.openedAt >= this.cooldownMs) {
      this.state = 'half-open';
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    if (this.state === 'half-open') {
      // Trial failed - reopen with renewed cooldown.
      this.state = 'open';
      this.openedAt = this.now();
      return;
    }
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.threshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  }
}

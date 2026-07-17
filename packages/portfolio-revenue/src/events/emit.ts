import type {
  PortfolioEvent,
  PortfolioEventDimensions,
  PortfolioEventName,
} from './taxonomy';
import type { EventSink } from './sink';

/**
 * A Measurement is a bound set of sinks for one runtime (server or client).
 * Construct it once with whichever sinks are available, then call `emit()`.
 * Fan-out is synchronous + best-effort: sinks are contractually non-throwing,
 * and Measurement guards again so a misbehaving sink can never break the
 * caller (critical on the affiliate-redirect path).
 *
 * Domain-neutral: Measurement knows nothing about travel, providers, or GA4 —
 * only events + sinks. Product-specific wiring lives in each app's adapter.
 */
export class Measurement {
  constructor(private readonly sinks: readonly EventSink[]) {}

  emit(
    name: PortfolioEventName,
    dimensions: PortfolioEventDimensions = {},
    at: number = Date.now(),
  ): void {
    const event: PortfolioEvent = { name, dimensions, at };
    for (const sink of this.sinks) {
      try {
        sink.emit(event);
      } catch {
        /* isolate sink failures — one bad sink never blocks the others */
      }
    }
  }

  /** Sink names, for diagnostics/health checks. */
  get sinkNames(): string[] {
    return this.sinks.map((s) => s.name);
  }
}

/** A Measurement with no sinks — safe default for disabled paths + tests. */
export const NULL_MEASUREMENT = new Measurement([]);

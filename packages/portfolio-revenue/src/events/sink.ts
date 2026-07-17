import type { PortfolioEvent } from './taxonomy';

/**
 * An EventSink receives fully-formed, domain-neutral events. Sinks are
 * swappable + composable — the Measurement fans one event out to every
 * configured sink.
 *
 * CONTRACT: a sink MUST be non-throwing and non-blocking. Measurement is on the
 * critical path of an affiliate redirect; a sink failure must never break a
 * user flow. Implementations swallow their own errors, and Measurement guards
 * again as defence in depth.
 */
export interface EventSink {
  readonly name: string;
  emit(event: PortfolioEvent): void;
}

/**
 * ConsoleSink — a single structured stdout line per event. Always-on,
 * un-deletable audit trail: greppable in logs and dumpable to a spreadsheet.
 * This is the reliable floor beneath GA4 — even if every other sink is
 * unconfigured, the click is recorded here. The `[pre]` prefix + JSON body make
 * it machine-parseable.
 */
export class ConsoleSink implements EventSink {
  readonly name = 'console';
  constructor(private readonly log: (line: string) => void = (l) => console.info(l)) {}
  emit(event: PortfolioEvent): void {
    try {
      this.log(`[pre] ${JSON.stringify({ e: event.name, at: event.at, ...event.dimensions })}`);
    } catch {
      /* never throw from a sink */
    }
  }
}

/**
 * A GA4-style sender: `(eventName, params) => void`. Kept as an injected
 * dependency so the domain-neutral core never imports gtag / a GA4 SDK and
 * stays portable. On the client pass `window.gtag`-backed sender; on the server
 * pass a Measurement-Protocol wrapper (added in a later phase).
 */
export type Ga4Send = (
  eventName: string,
  params: Record<string, string | number | boolean>,
) => void;

/**
 * Ga4Sink — forwards each event to the injected GA4 sender, dropping undefined
 * dimensions (GA4 rejects undefined param values). Event name + dimension keys
 * pass through unchanged, so the GA4 report schema mirrors the taxonomy.
 */
export class Ga4Sink implements EventSink {
  readonly name = 'ga4';
  constructor(private readonly send: Ga4Send) {}
  emit(event: PortfolioEvent): void {
    try {
      const params: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(event.dimensions)) {
        if (v !== undefined) params[k] = v;
      }
      this.send(event.name, params);
    } catch {
      /* never throw from a sink */
    }
  }
}

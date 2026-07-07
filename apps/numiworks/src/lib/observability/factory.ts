import type { TraceLogger } from '@core/agent';
import { CompositeTraceLogger } from './composite-trace-logger';
import { LangfuseTraceLogger } from './langfuse-trace-logger';
import { MemoryTraceLogger } from './memory-trace-logger';

/**
 * Build the process-wide TraceLogger composite. Always includes the
 * in-memory sink; conditionally adds Langfuse when keys are set.
 *
 * Cached per-process - same instance across the orchestrator + the
 * dashboard's read API. Reset only when env changes (tests).
 */

// Process-global anchor - see comment in src/lib/session/factory.ts.
declare global {
  var __stayscoutTraceLogger: TraceLogger | undefined;
}

export function getTraceLogger(): TraceLogger {
  if (globalThis.__stayscoutTraceLogger) return globalThis.__stayscoutTraceLogger;
  const sinks: TraceLogger[] = [new MemoryTraceLogger()];
  const langfuse = LangfuseTraceLogger.fromEnv();
  if (langfuse) sinks.push(langfuse);
  globalThis.__stayscoutTraceLogger = new CompositeTraceLogger(sinks);
  return globalThis.__stayscoutTraceLogger;
}

/** Test-only - drop the cached composite so env changes take effect. */
export function _resetTraceLoggerForTesting(): void {
  globalThis.__stayscoutTraceLogger = undefined;
}

import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { AgentId } from '@core/ids';
import type { TraceLogger } from '@core/agent';
import { computeCostUsd } from './costs';
import { getMemoryTelemetryStore } from './memory-telemetry-store';

/**
 * TraceLogger sink that writes into the in-memory telemetry buffer the
 * admin dashboard reads from. Always-on; the lightest sink we have.
 *
 * - `turn.started` → beginTurn
 * - `turn.completed` → completeTurn
 * - `turn.failed` → failTurn
 * - `recordAgentRun` → record under the most recent in-flight turn
 *   for the same agent's turnId (we look it up by event flow because
 *   the agent run callback doesn't carry turnId today)
 *
 * Cost is computed at sink-time from `modelMeta`, keeping pricing out
 * of agent code.
 */
export class MemoryTraceLogger implements TraceLogger {
  /** Map sessionId → latest in-flight turnId, used to associate
   *  agent runs with their parent turn (the recordAgentRun signature
   *  doesn't carry turnId today). */
  private readonly latestTurnIdBySession = new Map<string, string>();
  /** Track all active turn ids so we can attribute agent runs that
   *  arrive after turn.started but before any later turn starts. */
  private currentTurnId: string | null = null;

  recordEvent(event: OrchestratorEvent): void {
    const store = getMemoryTelemetryStore();
    switch (event.kind) {
      case 'session.started':
        // Nothing to record at the buffer level - turn-scoped.
        break;
      case 'turn.started':
        store.beginTurn({
          turnId: event.turnId,
          sessionId: this.lastSeenSessionId ?? 'unknown',
          ...(event.type ? { type: event.type } : {}),
        });
        this.currentTurnId = event.turnId;
        break;
      case 'turn.completed':
        store.completeTurn(event.turnId, { durationMs: event.durationMs });
        break;
      case 'turn.failed':
        store.failTurn(event.turnId, { error: event.error });
        break;
      default:
        break;
    }
    if (event.kind === 'session.started') {
      this.lastSeenSessionId = event.sessionId;
    }
  }

  recordAgentRun(
    agent: AgentId,
    _input: unknown,
    _output: unknown,
    durationMs: number,
    modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
  ): void {
    if (!this.currentTurnId) return;
    const cost = modelMeta
      ? computeCostUsd(modelMeta.model, modelMeta.tokensIn, modelMeta.tokensOut)
      : null;
    getMemoryTelemetryStore().recordAgentRun(this.currentTurnId, {
      agent: agent as string,
      durationMs,
      ...(modelMeta?.model ? { model: modelMeta.model } : {}),
      ...(modelMeta ? { tokensIn: modelMeta.tokensIn, tokensOut: modelMeta.tokensOut } : {}),
      ...(modelMeta?.cacheHit !== undefined ? { cacheHit: modelMeta.cacheHit } : {}),
      ...(cost !== null ? { costUsd: cost } : {}),
    });
  }

  private lastSeenSessionId: string | null = null;
}

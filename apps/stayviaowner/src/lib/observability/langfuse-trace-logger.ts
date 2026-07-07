import type { OrchestratorEvent } from '@core/orchestrator-event';
import type { AgentId } from '@core/ids';
import type { TraceLogger } from '@core/agent';
import { computeCostUsd } from './costs';

/**
 * Langfuse-backed TraceLogger. Dynamic-imports the SDK in `init()` so
 * the keyless build path never evaluates Langfuse code.
 *
 * Mapping:
 *   - one Langfuse trace per turnId
 *   - one observation/span per `recordAgentRun`, with:
 *       input/output snippets,
 *       totalCost in USD,
 *       latency in ms,
 *       cacheHit + model + token counts as metadata
 *   - `recordEvent(turn.failed | turn.completed)` ends the trace
 *
 * Failure isolation: every SDK call is wrapped in try/catch. If
 * Langfuse is unreachable or throws, we log at warn level and let the
 * request flow continue. CompositeTraceLogger also wraps us, so this
 * is belt + suspenders.
 */

/** Minimal interface we use from the langfuse SDK - saves us from
 *  importing the SDK's own types in the keyless build path. */
interface LangfuseTraceHandle {
  generation(args: {
    name: string;
    input?: unknown;
    output?: unknown;
    model?: string;
    usage?: { input?: number; output?: number; total?: number; unit?: string };
    metadata?: Record<string, unknown>;
    startTime?: Date;
    endTime?: Date;
  }): unknown;
  update(args: { metadata?: Record<string, unknown> }): unknown;
}

interface LangfuseClient {
  trace(args: {
    id?: string;
    name?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }): LangfuseTraceHandle;
  shutdownAsync?: () => Promise<void>;
}

export class LangfuseTraceLogger implements TraceLogger {
  private client: LangfuseClient | null = null;
  private readonly traces = new Map<string, LangfuseTraceHandle>();
  private currentTurnId: string | null = null;
  private currentSessionId: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly opts: {
      publicKey: string;
      secretKey: string;
      host?: string;
    },
  ) {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      const mod = (await import('langfuse')) as {
        Langfuse: new (opts: {
          publicKey: string;
          secretKey: string;
          baseUrl?: string;
        }) => LangfuseClient;
      };
      const init: { publicKey: string; secretKey: string; baseUrl?: string } = {
        publicKey: this.opts.publicKey,
        secretKey: this.opts.secretKey,
      };
      if (this.opts.host) init.baseUrl = this.opts.host;
      this.client = new mod.Langfuse(init);
    } catch (err) {
      console.warn('[langfuse] init failed; traces will be skipped:', err);
      this.client = null;
    }
  }

  recordEvent(event: OrchestratorEvent): void {
    if (event.kind === 'session.started') {
      this.currentSessionId = event.sessionId;
      return;
    }
    if (event.kind === 'turn.started') {
      this.currentTurnId = event.turnId;
      void this.openTrace(event.turnId);
      return;
    }
    if (event.kind === 'turn.completed' || event.kind === 'turn.failed') {
      const handle = this.traces.get(event.turnId);
      if (handle) {
        try {
          handle.update({
            metadata: {
              status: event.kind === 'turn.completed' ? 'completed' : 'failed',
              ...(event.kind === 'turn.completed' ? { durationMs: event.durationMs } : {}),
              ...(event.kind === 'turn.failed' ? { error: event.error } : {}),
            },
          });
        } catch (err) {
          console.warn('[langfuse] trace.update failed:', err);
        }
        this.traces.delete(event.turnId);
      }
    }
  }

  recordAgentRun(
    agent: AgentId,
    input: unknown,
    output: unknown,
    durationMs: number,
    modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
  ): void {
    if (!this.currentTurnId) return;
    void this.appendGeneration(this.currentTurnId, agent, input, output, durationMs, modelMeta);
  }

  private async openTrace(turnId: string): Promise<void> {
    await this.initPromise;
    if (!this.client) return;
    if (this.traces.has(turnId)) return;
    try {
      const handle = this.client.trace({
        id: turnId,
        name: 'concierge.turn',
        ...(this.currentSessionId ? { sessionId: this.currentSessionId } : {}),
      });
      this.traces.set(turnId, handle);
    } catch (err) {
      console.warn('[langfuse] trace() failed:', err);
    }
  }

  private async appendGeneration(
    turnId: string,
    agent: AgentId,
    input: unknown,
    output: unknown,
    durationMs: number,
    modelMeta?: { model: string; tokensIn: number; tokensOut: number; cacheHit?: boolean },
  ): Promise<void> {
    await this.initPromise;
    const handle = this.traces.get(turnId);
    if (!handle) return;
    const cost = modelMeta
      ? computeCostUsd(modelMeta.model, modelMeta.tokensIn, modelMeta.tokensOut)
      : null;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - durationMs);
    try {
      const args: Parameters<LangfuseTraceHandle['generation']>[0] = {
        name: agent as string,
        input,
        output,
        startTime,
        endTime,
        metadata: {
          durationMs,
          ...(cost !== null ? { costUsd: cost } : {}),
          ...(modelMeta?.cacheHit !== undefined ? { cacheHit: modelMeta.cacheHit } : {}),
        },
      };
      if (modelMeta) {
        args.model = modelMeta.model;
        args.usage = {
          input: modelMeta.tokensIn,
          output: modelMeta.tokensOut,
          total: modelMeta.tokensIn + modelMeta.tokensOut,
          unit: 'TOKENS',
        };
      }
      handle.generation(args);
    } catch (err) {
      console.warn('[langfuse] generation() failed:', err);
    }
  }

  /** Construct from env, returning null when keys are missing. */
  static fromEnv(): LangfuseTraceLogger | null {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    if (!publicKey || !secretKey) return null;
    const opts: { publicKey: string; secretKey: string; host?: string } = {
      publicKey,
      secretKey,
    };
    if (process.env.LANGFUSE_HOST) opts.host = process.env.LANGFUSE_HOST;
    return new LangfuseTraceLogger(opts);
  }
}

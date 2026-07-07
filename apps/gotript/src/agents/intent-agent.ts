import type { Agent, AgentContext } from '@core/agent';
import { agentId } from '@core/ids';
import { TripIntentSchema, type TripIntent } from '@core/trip-intent';
import { INTENT_SYSTEM_PROMPT, INTENT_FEW_SHOTS } from '@lib/ai/prompts/intent-system';
import { buildComposePrompt, buildRefinePrompt } from '@lib/ai/prompts/intent-refine';
import { coerceTripIntentShortcuts, synthesizeFallbackIntent } from './fallback-intent';

export interface IntentAgentInput {
  rawInput: string;
  priorIntent?: TripIntent;
  /**
   * Pre-formatted memory block (Slice C1). When the orchestrator's
   * `MemoryRetriever` found relevant prior memories for the owner, it
   * passes the formatted `<memory>` prompt block here. The agent
   * appends it to the user message (NOT the system prompt - keeps the
   * cached system block effective).
   */
  priorMemoryBlock?: string;
}

export const INTENT_AGENT_ID = agentId('intent');
export const INTENT_MODEL = 'claude-haiku-4-5';

/**
 * Resilience strategy:
 *   1. Call the model. If it returns a valid TripIntent, use that.
 *   2. Tool-use shortcut coercion: model occasionally emits the bare
 *      string `"unspecified"` instead of `{kind: "unspecified"}` for
 *      trivial discriminated-union variants. `coerceTripIntentShortcuts`
 *      expands those before the authoritative Zod parse.
 *   3. If anything fails - network error, schema mismatch even after
 *      coercion, timeout - `synthesizeFallbackIntent(rawInput)` returns
 *      a heuristic-derived intent so the demo never blocks on a model
 *      error. Surfaced via console.warn so operators see when fallback
 *      activates.
 *
 * The agent's contract (returns TripIntent) is unchanged. Callers can't
 * tell whether they got a model-derived or fallback intent - by design.
 */
export const IntentAgent: Agent<IntentAgentInput, TripIntent> = {
  id: INTENT_AGENT_ID,
  name: 'Intent Agent',
  version: '0.2.0',

  async run(input: IntentAgentInput, ctx: AgentContext): Promise<TripIntent> {
    const startedAt = performance.now();

    ctx.emit.progress(input.priorIntent ? 'Adjusting your trip' : 'Reading your trip');

    const basePrompt = input.priorIntent
      ? buildRefinePrompt({ rawInput: input.rawInput, priorIntent: input.priorIntent })
      : buildComposePrompt(input.rawInput);
    const userPrompt = input.priorMemoryBlock
      ? `${input.priorMemoryBlock}\n\n${basePrompt}`
      : basePrompt;

    const system = `${INTENT_SYSTEM_PROMPT}\n\n${INTENT_FEW_SHOTS}`;

    try {
      const { result: parsed, modelMeta } = await ctx.modelClient.generateWithMeta({
        model: INTENT_MODEL,
        system,
        messages: [{ role: 'user', content: userPrompt }],
        responseSchema: TripIntentSchema,
        cacheKey: 'intent-extraction-v1',
        maxTokens: 2048,
        temperature: 0.2,
        // Tool-use occasionally collapses `{kind: 'X'}` to the bare
        // string `'X'` for trivial discriminated-union variants. The
        // client applies this BEFORE Zod's strict parse.
        coerce: coerceTripIntentShortcuts,
      });

      // Hard rule (spec §3.1): rawInput is preserved verbatim,
      // regardless of what the model emitted. Models occasionally
      // rewrite or truncate this field; we own it.
      const result: TripIntent = { ...parsed, rawInput: input.rawInput };

      const durationMs = Math.round(performance.now() - startedAt);
      ctx.traceLogger.recordAgentRun(INTENT_AGENT_ID, input, result, durationMs, modelMeta);
      return result;
    } catch (err) {
      // Cancellation propagates - never fall back on a user-initiated abort.
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      console.warn('[intent-agent] model call failed - using deterministic fallback intent', {
        rawInput: input.rawInput,
        error: err instanceof Error ? err.message : String(err),
      });
      const result = synthesizeFallbackIntent(input.rawInput);
      const durationMs = Math.round(performance.now() - startedAt);
      ctx.traceLogger.recordAgentRun(INTENT_AGENT_ID, input, result, durationMs);
      return result;
    }
  },
};

import { describe, expect, it } from 'vitest';
import { ConciergeRequestBodySchema } from '@core/concierge-request';

/**
 * The public `POST /api/concierge` route validates the body with
 * ConciergeRequestBodySchema BEFORE building the orchestrator request or
 * calling any model. This guards the input-length cap so an oversized
 * prompt is rejected at the schema boundary and never reaches the LLM
 * provider — token-cost / abuse protection for an unauthenticated route.
 */
describe('concierge input-length cap', () => {
  const base = {
    turnId: 'turn_test',
    type: 'compose' as const,
    clientCapabilities: {
      supportsAdaptationDelta: true,
      supportsMoodSnapshot: true,
      supportsMemoryHint: true,
    },
  };

  it('accepts input at the 1000-character limit', () => {
    const result = ConciergeRequestBodySchema.safeParse({
      ...base,
      input: { rawInput: 'a'.repeat(1000) },
    });
    expect(result.success).toBe(true);
  });

  it('rejects input over 1000 characters before it can reach the model', () => {
    const result = ConciergeRequestBodySchema.safeParse({
      ...base,
      input: { rawInput: 'a'.repeat(1001) },
    });
    expect(result.success).toBe(false);
  });
});

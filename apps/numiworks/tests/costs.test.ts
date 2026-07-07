import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MODEL_PRICING,
  _resetCostWarningsForTesting,
  computeCostUsd,
} from '@/lib/observability/costs';

afterEach(() => {
  _resetCostWarningsForTesting();
});

describe('computeCostUsd', () => {
  it('returns 0 for zero tokens', () => {
    expect(computeCostUsd('claude-sonnet-4-7', 0, 0)).toBe(0);
  });

  it('matches the price-per-million math for sonnet', () => {
    // 1M input + 1M output at sonnet = $3 + $15 = $18
    expect(computeCostUsd('claude-sonnet-4-7', 1_000_000, 1_000_000)).toBeCloseTo(18, 6);
  });

  it('matches the price-per-million math for opus', () => {
    // 1M input + 1M output at opus = $15 + $75 = $90
    expect(computeCostUsd('claude-opus-4-7', 1_000_000, 1_000_000)).toBeCloseTo(90, 6);
  });

  it('scales linearly under 1M tokens', () => {
    expect(computeCostUsd('claude-haiku-4-7', 100_000, 200_000)).toBeCloseTo(0.1 * 1 + 0.2 * 5, 6);
  });

  it('returns null + warns once for unknown models', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(computeCostUsd('gpt-9000', 100, 100)).toBeNull();
    expect(computeCostUsd('gpt-9000', 999, 999)).toBeNull(); // no second warn
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('every priced model is internally consistent', () => {
    for (const [model, p] of Object.entries(MODEL_PRICING)) {
      expect(p.inputPerMillion).toBeGreaterThan(0);
      expect(p.outputPerMillion).toBeGreaterThan(0);
      // Output is always at least as expensive as input (Anthropic
      // pricing rule of thumb - flag if a future entry inverts).
      expect(p.outputPerMillion).toBeGreaterThanOrEqual(p.inputPerMillion);
      expect(computeCostUsd(model, 1, 1)).toBeGreaterThan(0);
    }
  });
});

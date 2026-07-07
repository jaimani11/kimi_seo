/**
 * Per-model token pricing. USD per 1M tokens. Updated ad-hoc as
 * Anthropic's pricing pages change - keep this aligned with the
 * `claude-` model identifiers we actually pass to the model client.
 *
 * Source: https://docs.anthropic.com/en/docs/about-claude/models
 * (read-once at slice authoring; safe to update inline as needed).
 */

export interface ModelPricing {
  /** USD per 1M input tokens. */
  inputPerMillion: number;
  /** USD per 1M output tokens. */
  outputPerMillion: number;
}

export const MODEL_PRICING: Readonly<Record<string, ModelPricing>> = {
  // Claude 4.7 generation
  'claude-opus-4-7': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-sonnet-4-7': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-7': { inputPerMillion: 1, outputPerMillion: 5 },

  // Claude 4.6
  'claude-opus-4-6': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-sonnet-4-6': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-6': { inputPerMillion: 0.8, outputPerMillion: 4 },

  // Claude 4.5
  'claude-opus-4-5': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-sonnet-4-5': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-5': { inputPerMillion: 0.8, outputPerMillion: 4 },
};

const _warnedModels = new Set<string>();

/**
 * Compute USD cost for a model invocation. Returns null when the model
 * isn't in the price table (logged once per unknown model - repeated
 * calls don't spam logs).
 */
export function computeCostUsd(model: string, tokensIn: number, tokensOut: number): number | null {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    if (!_warnedModels.has(model)) {
      _warnedModels.add(model);
      console.warn(`[costs] unknown model "${model}" - cost will not be reported`);
    }
    return null;
  }
  const inputCost = (tokensIn / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (tokensOut / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}

/** Test-only - clear the unknown-model warning set so tests are isolated. */
export function _resetCostWarningsForTesting(): void {
  _warnedModels.clear();
}

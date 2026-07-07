import type { TripIntent } from '@core/trip-intent';

// Build a refine-variant user message that includes the prior intent so
// the model produces a NEW intent reflecting the user's adjustment. The
// IntentDelta is computed downstream by the orchestrator (Slice A5) by
// structurally diffing prior vs new - we keep the model's output shape
// identical to compose so the IntentAgent has one return type.

export function buildRefinePrompt(args: { rawInput: string; priorIntent: TripIntent }): string {
  return `The user is REFINING an existing trip - not starting over.

Their adjustment: ${JSON.stringify(args.rawInput)}

Their prior trip intent:
${JSON.stringify(args.priorIntent, null, 2)}

Produce a NEW TripIntent that reflects the adjustment. Only change the fields the user actually adjusted. Preserve everything else from the prior intent. The new \`rawInput\` should be the user's adjustment text (not the original trip description).`;
}

export function buildComposePrompt(rawInput: string): string {
  return `User input: ${JSON.stringify(rawInput)}

Produce the TripIntent.`;
}

import { z } from 'zod';
import type { Agent } from '@core/agent';
import { agentId } from '@core/ids';
import type { Destination, VibeTag } from '@core/trip-intent';
import { lintVoice } from '@lib/curation';
import { DESTINATION_FLAVOR_SYSTEM_PROMPT } from './prompts/destination-flavor-system';

/**
 * Slice F1 - DestinationFlavorAgent.
 *
 * Produces a one- or two-sentence "feel of the place" line for a
 * destination + traveler context. Used by the orchestrator on the
 * opportunity path (when we don't have real/curated inventory) to
 * decorate the SearchOpportunityBoard hero with editorial voice.
 *
 * This is the surviving, narrowed slice of the old LLMSynthesized
 * provider: that provider used to invent fake hotels, which F1 retires.
 * The flavor agent reuses the same voice rules (anti-cliché lint, no
 * invented brand names) and the same temperature/cache discipline, but
 * only generates a single piece of editorial copy - never property data.
 *
 * Failure mode: returns `null` when the agent can't produce
 * voice-compliant text within retries. The caller treats that as
 * "no flavor line, render board without it" - the SearchOpportunity
 * UI degrades gracefully on a missing `flavor` field.
 */

export interface DestinationFlavorAgentInput {
  destination: Destination;
  vibeTags: readonly VibeTag[];
  travelers: { adults: number; children: number };
}

export interface DestinationFlavor {
  text: string;
  source: 'llm';
}

const ResponseSchema = z.object({ text: z.string().min(8).max(240) });
const FLAVOR_AGENT_ID = agentId('destination-flavor');
const MODEL_ID = 'claude-haiku-4-5';
const MAX_CHARS = 220;

export const DestinationFlavorAgent: Agent<DestinationFlavorAgentInput, DestinationFlavor | null> =
  {
    id: FLAVOR_AGENT_ID,
    name: 'Destination Flavor Agent',
    version: '0.1.0',

    async run(input, ctx): Promise<DestinationFlavor | null> {
      const startedAt = performance.now();
      ctx.emit.progress('Composing the destination feel');

      const userPrompt = buildUserPrompt(input);

      let attempt = 0;
      let lastErr: unknown;
      while (attempt < 2) {
        attempt += 1;
        try {
          const resp = await ctx.modelClient.generate({
            model: MODEL_ID,
            system:
              DESTINATION_FLAVOR_SYSTEM_PROMPT +
              (attempt > 1
                ? '\n\nYour previous attempt used a banned word or exceeded the character limit - try again with grounded sensory language, under 220 characters.'
                : ''),
            messages: [{ role: 'user', content: userPrompt }],
            responseSchema: ResponseSchema,
            cacheKey: 'destination-flavor-v1',
            maxTokens: 256,
            temperature: 0.7,
          });
          const text = resp.text.trim();
          if (text.length > MAX_CHARS) {
            lastErr = new Error(`flavor too long: ${text.length} chars`);
            continue;
          }
          const lint = lintVoice(text);
          if (!lint.ok) {
            lastErr = new Error(
              `flavor tripped voice lint: ${lint.matches.map((m) => m.word).join(', ')}`,
            );
            continue;
          }
          const result: DestinationFlavor = { text, source: 'llm' };
          ctx.traceLogger.recordAgentRun(
            FLAVOR_AGENT_ID,
            input,
            result,
            Math.round(performance.now() - startedAt),
          );
          return result;
        } catch (err) {
          lastErr = err;
        }
      }
      // Caller decides what to do - return null + log, let the
      // SearchOpportunity render without a flavor line.
      console.warn('[destination-flavor-agent] giving up', {
        destination: input.destination.name,
        error: lastErr instanceof Error ? lastErr.message : String(lastErr),
      });
      return null;
    },
  };

function buildUserPrompt(input: DestinationFlavorAgentInput): string {
  const { destination, vibeTags, travelers } = input;
  const sleeps = travelers.adults + travelers.children;
  const partyLine =
    sleeps === 1
      ? 'Solo traveler.'
      : sleeps === 2
        ? '2 travelers.'
        : `${sleeps} travelers (${travelers.adults} adults${travelers.children > 0 ? `, ${travelers.children} children` : ''}).`;
  const vibeLine =
    vibeTags.length > 0 ? `Vibe: ${vibeTags.join(', ')}.` : 'No specific vibe given.';
  return `Destination: ${destination.name} (${destination.country}${destination.region ? `, ${destination.region}` : ''}).
${partyLine}
${vibeLine}

Write the feel of this place for this trip in 1–2 sentences, max 220 characters. Output { text: string }.`;
}

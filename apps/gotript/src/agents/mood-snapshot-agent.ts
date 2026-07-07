import { z } from 'zod';
import type { Agent, AgentContext } from '@core/agent';
import { agentId } from '@core/ids';
import type { Destination } from '@core/trip-intent';
import type { MoodSnapshot } from '@core/reasoning';
import { CURATED_MOODS, findDestinationBySlugOrAlias, lintVoice } from '@lib/curation';
import { MOOD_SYSTEM_PROMPT } from './prompts/mood-system';

export interface MoodSnapshotAgentInput {
  destination: Destination;
}

const ResponseSchema = z.object({ text: z.string().min(8).max(180) });
const MOOD_AGENT_ID = agentId('mood');
const MODEL_ID = 'claude-haiku-4-5';

/**
 * MoodSnapshotAgent. Curated path for known destinations (zero LLM cost,
 * zero latency). LLM path with anti-cliché lint and a single retry for
 * unknown destinations. Throws on persistent banned-word output so the
 * orchestrator suppresses the snapshot - "better silent than corny."
 */
export const MoodSnapshotAgent: Agent<MoodSnapshotAgentInput, MoodSnapshot> = {
  id: MOOD_AGENT_ID,
  name: 'Mood Snapshot Agent',
  version: '0.1.0',

  async run(input: MoodSnapshotAgentInput, ctx: AgentContext): Promise<MoodSnapshot> {
    const startedAt = performance.now();
    ctx.emit.progress('Composing the vibe');

    const curated = findCurated(input.destination);
    if (curated) {
      ctx.traceLogger.recordAgentRun(
        MOOD_AGENT_ID,
        input,
        curated,
        Math.round(performance.now() - startedAt),
      );
      return curated;
    }

    const userPrompt = `Destination: ${input.destination.name} (${input.destination.country}${input.destination.region ? `, ${input.destination.region}` : ''}).`;

    let attempt = 0;
    let lastErr: unknown;
    while (attempt < 2) {
      attempt += 1;
      try {
        const resp = await ctx.modelClient.generate({
          model: MODEL_ID,
          system:
            MOOD_SYSTEM_PROMPT +
            (attempt > 1
              ? '\n\nYour previous attempt used a banned word - try again with grounded sensory language.'
              : ''),
          messages: [{ role: 'user', content: userPrompt }],
          responseSchema: ResponseSchema,
          cacheKey: 'mood-snapshot-v1',
          maxTokens: 256,
          temperature: 0.7,
        });
        const lint = lintVoice(resp.text);
        if (!lint.ok) {
          lastErr = new Error(
            `mood snapshot tripped voice lint: ${lint.matches.map((m) => m.word).join(', ')}`,
          );
          continue;
        }
        const result: MoodSnapshot = {
          destinationName: input.destination.name,
          text: resp.text.trim(),
          source: 'llm',
          confidence: 0.7,
        };
        ctx.traceLogger.recordAgentRun(
          MOOD_AGENT_ID,
          input,
          result,
          Math.round(performance.now() - startedAt),
        );
        return result;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error('mood snapshot generation failed');
  },
};

function findCurated(dest: Destination): MoodSnapshot | null {
  if (dest.country !== 'IT') return null;
  const curated = findDestinationBySlugOrAlias(dest.name);
  if (!curated) return null;
  return CURATED_MOODS[curated.slug] ?? null;
}

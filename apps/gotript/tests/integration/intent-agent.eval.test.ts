import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IntentAgent } from '@/agents/intent-agent';
import { AnthropicModelClient } from '@/lib/ai/anthropic-client';
import { turnId } from '@core/ids';
import type { AgentContext } from '@core/agent';
import type { TripIntent } from '@core/trip-intent';

const SHOULD_RUN = process.env.RUN_EVAL_TESTS === '1' && !!process.env.ANTHROPIC_API_KEY;

interface GoldenCase {
  input: string;
  expected: {
    destinations?: { country?: string; name?: string }[];
    duration?: { nights?: number; flexible?: boolean };
    travelers?: { adults?: number; children?: { count?: number }; groupKind?: string };
    budget?: { kind?: string; amount?: number };
    vibeMust?: string[];
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

function loadGolden(): GoldenCase[] {
  const path = resolve(__dirname, '../eval/intent-extraction/golden.json');
  return JSON.parse(readFileSync(path, 'utf8')) as GoldenCase[];
}

function ctxWith(client: AnthropicModelClient): AgentContext {
  return {
    turnId: turnId('t-eval'),
    signal: new AbortController().signal,
    emit: { progress: () => {}, explanation: () => {} },
    modelClient: client,
    traceLogger: { recordEvent: () => {}, recordAgentRun: () => {} },
  };
}

function assertGolden(intent: TripIntent, expected: GoldenCase['expected']): void {
  if (expected.destinations?.[0]?.country) {
    expect(intent.destinations[0]?.country).toBe(expected.destinations[0].country);
  }
  if (expected.duration?.nights !== undefined) {
    expect(intent.duration.nights).toBe(expected.duration.nights);
  }
  if (expected.travelers?.adults !== undefined) {
    expect(intent.travelers.adults).toBe(expected.travelers.adults);
  }
  if (expected.travelers?.groupKind) {
    expect(intent.travelers.groupKind).toBe(expected.travelers.groupKind);
  }
  if (expected.budget?.kind) {
    expect(intent.budget.kind).toBe(expected.budget.kind);
  }
  if (expected.vibeMust) {
    for (const tag of expected.vibeMust) {
      expect(intent.vibe.tags).toContain(tag);
    }
  }
}

describe.skipIf(!SHOULD_RUN)('IntentAgent (eval against golden cases)', () => {
  const cases = loadGolden();
  for (const c of cases) {
    it(`extracts: ${c.input.slice(0, 60)}...`, async () => {
      const client = new AnthropicModelClient();
      const intent = await IntentAgent.run({ rawInput: c.input }, ctxWith(client));
      expect(intent.rawInput).toBe(c.input);
      assertGolden(intent, c.expected);
    }, 30_000);
  }
});

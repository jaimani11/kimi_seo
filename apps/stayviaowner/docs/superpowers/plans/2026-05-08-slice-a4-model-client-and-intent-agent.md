# StayScout Slice A4 - ModelClient + IntentAgent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land the AI core - a real `AnthropicModelClient` implementing the `ModelClient` interface (with structured outputs via tool use, prompt caching, and streaming), plus the `IntentAgent` that turns natural language into a validated `TripIntent` for both compose and refine flows. After A4, the system can take a sentence and produce a typed intent that the rest of the architecture already programs against.

**Architecture:** `AnthropicModelClient` lives in `src/lib/ai/`, depending only on `core` and `@anthropic-ai/sdk`. Structured outputs use the tool-use pattern: define a single tool whose `input_schema` is the Zod schema converted to JSON Schema, force tool use, parse and re-validate. System prompts use Anthropic's `cache_control: ephemeral` markers so the per-turn cost is just the user message. The `IntentAgent` is `Agent<{rawInput, priorIntent?}, TripIntent>` - same shape for compose and refine; the prompt template branches internally.

**Tests:** Unit tests use `MockModelClient` (a hand-rolled test helper) so the suite runs offline. A `test:live` script runs gated integration tests against the real API. A `test:eval` script runs the §8.15 golden cases through the live API.

**Tech additions:** `@anthropic-ai/sdk`, `zod-to-json-schema`.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md) §3.5, §6.7, §8.15

---

## Slice A4 file structure

```
src/lib/ai/
├── anthropic-client.ts        [new] AnthropicModelClient impl
├── prompts/
│   ├── intent-system.ts       [new] Intent extraction system prompt + few-shot
│   └── intent-refine.ts       [new] Refine-variant addendum
└── index.ts                   [new] barrel

src/agents/
├── intent-agent.ts            [new] IntentAgent impl
└── index.ts                   [modify] barrel - re-export IntentAgent

tests/
├── helpers/
│   └── mock-model-client.ts   [new] MockModelClient with .respond()/.calls/.reset()
├── intent-agent.test.ts       [new] unit tests with mock client
└── integration/
    ├── anthropic-client.live.test.ts  [new] gated by RUN_LIVE_API_TESTS=1
    └── intent-agent.eval.test.ts       [new] gated by RUN_EVAL_TESTS=1, runs golden cases

.env.example                   [new] documents ANTHROPIC_API_KEY
package.json                   [modify] add test:live + test:eval scripts
```

Total: ~10 new files.

---

## Task 1: Install Anthropic SDK + zod-to-json-schema, set up env

- [ ] Install:
  ```bash
  pnpm add @anthropic-ai/sdk zod-to-json-schema
  ```

- [ ] Create `.env.example`:
  ```
  # Anthropic API key - required for live model calls (IntentAgent, MoodSnapshotAgent).
  # Get one at https://console.anthropic.com/settings/keys
  ANTHROPIC_API_KEY=

  # Optional: override mock provider artificial latency (ms). Default 300.
  # Tests set this to 0.
  MOCK_PROVIDER_LATENCY_MS=
  ```

- [ ] Add scripts to `package.json`:
  ```json
  "test:live": "vitest run tests/integration/anthropic-client.live.test.ts",
  "test:eval": "vitest run tests/integration/intent-agent.eval.test.ts"
  ```

- [ ] Commit: `chore: install @anthropic-ai/sdk and add .env.example`

## Task 2: `AnthropicModelClient` (`src/lib/ai/anthropic-client.ts`)

Two methods. `generate<T>` always uses tool-use when `responseSchema` is present (the only way IntentAgent calls it). `stream()` adapts Anthropic's stream events to our `StreamChunk` union.

- [ ] Create `src/lib/ai/anthropic-client.ts`:
  ```ts
  import Anthropic from '@anthropic-ai/sdk';
  import { zodToJsonSchema } from 'zod-to-json-schema';
  import type {
    GenerateRequest,
    ModelClient,
    StreamChunk,
    StreamRequest,
  } from '@core/model-client';

  export class AnthropicClientError extends Error {
    constructor(
      message: string,
      readonly cause?: unknown,
    ) {
      super(message);
      this.name = 'AnthropicClientError';
    }
  }

  /**
   * AnthropicModelClient - implementation of the ModelClient interface
   * backed by @anthropic-ai/sdk. Slice A4. Slice B can wrap with a
   * RoutedModelClient that picks providers per-agent.
   *
   * - generate<T>: uses tool-use to enforce structured output when a
   *   responseSchema is provided; otherwise returns the assistant text
   *   cast to T (callers should set T = string).
   * - stream: adapts the SDK's stream event types into our StreamChunk
   *   union for the orchestrator's JSONL pipeline (Slice A5).
   *
   * Prompt caching: callers pass system as a string; we wrap it in a
   * single content block with cache_control: ephemeral so the system
   * prompt + few-shots are reused across turns. Cache hits show up in
   * the StreamChunk.finish.usage.cacheHitTokens.
   */
  export class AnthropicModelClient implements ModelClient {
    private readonly client: Anthropic;

    constructor(opts: { apiKey?: string } = {}) {
      const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AnthropicClientError(
          'ANTHROPIC_API_KEY is not set. Add it to your .env or pass via opts.apiKey.',
        );
      }
      this.client = new Anthropic({ apiKey });
    }

    async generate<T>(req: GenerateRequest<T>): Promise<T> {
      const systemBlocks = req.system
        ? [{ type: 'text' as const, text: req.system, cache_control: { type: 'ephemeral' as const } }]
        : undefined;

      // Tool-use path - enforces a JSON Schema output and returns the
      // parsed argument validated against the user's Zod schema.
      if (req.responseSchema) {
        const jsonSchema = zodToJsonSchema(req.responseSchema, {
          target: 'openApi3',
          $refStrategy: 'none',
        }) as Record<string, unknown>;

        const tool = {
          name: 'emit_structured_output',
          description: 'Emit the structured output that satisfies the schema.',
          input_schema: { ...jsonSchema, type: 'object' as const },
        };

        try {
          const resp = await this.client.messages.create({
            model: req.model,
            ...(systemBlocks ? { system: systemBlocks } : {}),
            messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
            tools: [tool],
            tool_choice: { type: 'tool', name: tool.name },
            max_tokens: req.maxTokens ?? 1024,
            ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          });

          const toolUse = resp.content.find(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
          );
          if (!toolUse) {
            throw new AnthropicClientError(
              `Model did not emit the expected tool_use block. Response: ${JSON.stringify(resp.content).slice(0, 400)}`,
            );
          }

          const parsed = req.responseSchema.safeParse(toolUse.input);
          if (!parsed.success) {
            throw new AnthropicClientError(
              `Tool output failed schema validation: ${parsed.error.message}`,
            );
          }
          return parsed.data;
        } catch (err) {
          if (err instanceof AnthropicClientError) throw err;
          throw new AnthropicClientError('Anthropic generate() failed', err);
        }
      }

      // Plain text path - returns the assistant's first text block as T.
      try {
        const resp = await this.client.messages.create({
          model: req.model,
          ...(systemBlocks ? { system: systemBlocks } : {}),
          messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: req.maxTokens ?? 1024,
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        });
        const textBlock = resp.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text',
        );
        return (textBlock?.text ?? '') as T;
      } catch (err) {
        throw new AnthropicClientError('Anthropic generate() failed', err);
      }
    }

    async *stream(req: StreamRequest): AsyncIterable<StreamChunk> {
      const systemBlocks = req.system
        ? [{ type: 'text' as const, text: req.system, cache_control: { type: 'ephemeral' as const } }]
        : undefined;

      const stream = this.client.messages.stream({
        model: req.model,
        ...(systemBlocks ? { system: systemBlocks } : {}),
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: req.maxTokens ?? 1024,
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      });

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { kind: 'text', text: event.delta.text };
          }
        }
        const final = await stream.finalMessage();
        const reason: 'end_turn' | 'max_tokens' | 'error' =
          final.stop_reason === 'max_tokens' ? 'max_tokens' : 'end_turn';
        yield {
          kind: 'finish',
          reason,
          usage: {
            inputTokens: final.usage.input_tokens,
            outputTokens: final.usage.output_tokens,
            cacheHitTokens: final.usage.cache_read_input_tokens ?? undefined,
          },
        };
      } catch (err) {
        yield { kind: 'finish', reason: 'error' };
        throw new AnthropicClientError('Anthropic stream() failed', err);
      }
    }
  }
  ```

- [ ] Commit: `feat(lib/ai): add AnthropicModelClient with tool-use structured output and streaming`

## Task 3: Intent extraction prompts

- [ ] Create `src/lib/ai/prompts/intent-system.ts`:
  ```ts
  // System prompt for the IntentAgent. Drafted to be cacheable -
  // identical across all turns of all sessions, so it lives entirely
  // in the cached system blocks.

  export const INTENT_SYSTEM_PROMPT = `You are the Intent Extraction Agent for StayScout, an AI travel concierge.

Your only job is to turn a user's natural-language description of a trip into a structured TripIntent that the rest of the system programs against.

Output rules:
- Preserve the user's exact original text in \`rawInput\`. Never paraphrase it there.
- Use only fields and enum values defined by the schema. Never invent fields, never invent tags.
- Default unspecified fields gracefully - do not invent destinations, dates, or budgets.
- Set \`confidence\` (0–1) on fields you inferred rather than were directly told. Use ≤0.5 for heavy guesses, ≥0.8 for things the user said outright.

Defaults when ambiguous:
- destinations: empty array if no destination was mentioned
- dates: { kind: 'unspecified' }
- duration.nights: 0, flexible: true if no duration mentioned
- travelers: { adults: 1, children: { count: 0 }, infants: 0 }
- budget: { kind: 'unspecified' }
- vibe.tags: []
- preferences.amenities/avoid: []
- caveats: []

VibeTag taxonomy (use ONLY these - never invent):
luxury, budget, mid-range, walkable, remote, urban, romantic, family-friendly,
group, foodie, cultural, nature, adventure, slow, fast-paced,
avoid-tourist-traps, iconic-landmarks, wellness, beach, mountains.

Inference rules:
- "family of 4" → adults: 2, children: { count: 2 }, groupKind: 'family' (assume 2 adults + 2 kids unless told otherwise)
- "my partner and I" / "wife and I" / "husband and I" → adults: 2, groupKind: 'couple'
- "just me" / "solo" → adults: 1, groupKind: 'solo'
- "luxury" / "boutique" / "high-end" → tag: luxury
- "budget" / "cheap" / "affordable" → tag: budget
- "no tourist traps" / "off the beaten path" → tag: avoid-tourist-traps
- Money like "$5k", "€2000", "$300/night" → set budget appropriately (kind=total or per-night, currency=USD/EUR/etc., flexibility=flexible unless they said firm)
- Date phrases:
  * "September" / "in September" → flexible-month with current year if month is upcoming, next year otherwise
  * "shoulder season" / "spring" / "fall" → flexible-season with appropriate season
  * "next month" → flexible-month with the next calendar month
  * Specific dates like "Sep 12 to Sep 19" → kind: 'specific'
- Country detection:
  * If only a city is given, infer the country (e.g., "Tokyo" → JP, "Paris" → FR)
  * If a region (Tuscany, Patagonia) is given, the country is that region's country
  * If unclear, set country: 'XX' and confidence: 0.3 on destinations

Be precise. Do not editorialise.`;

  // Optional few-shot examples - small to keep cache small. Anthropic's
  // ephemeral cache benefits most from STABLE system content, so the
  // few-shots live in the system block, not in the conversation.
  export const INTENT_FEW_SHOTS = `Example A:
User input: "Italy 7 days, family of 4, walkable, budget around $6k, no tourist traps"
Output (high level):
- destinations: [{ kind: 'curated', name: 'Italy', country: 'IT' }]
- duration: { nights: 7, flexible: false }
- travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' }
- budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' }
- vibe.tags: ['walkable', 'family-friendly', 'avoid-tourist-traps']
- caveats: []
- confidence: { destinations: 0.95, vibe: 0.85 }

Example B:
User input: "Tokyo for a long weekend, just me, foodie, denser the better"
Output (high level):
- destinations: [{ kind: 'synthesized', name: 'Tokyo', country: 'JP' }]
- duration: { nights: 3, flexible: true }
- travelers: { adults: 1, children: { count: 0 }, infants: 0, groupKind: 'solo' }
- budget: { kind: 'unspecified' }
- vibe.tags: ['foodie', 'urban']
- caveats: []
- confidence: { destinations: 0.92, vibe: 0.85 }`;
  ```

- [ ] Create `src/lib/ai/prompts/intent-refine.ts`:
  ```ts
  import type { TripIntent } from '@core/trip-intent';

  // Build a refine-variant user message that includes the prior intent
  // so the model produces a NEW intent reflecting the user's adjustment.
  // The IntentDelta is computed downstream by the orchestrator (Slice A5)
  // by structurally diffing prior vs new - we keep the model's output
  // shape identical to compose so the IntentAgent has one return type.

  export function buildRefinePrompt(args: {
    rawInput: string;
    priorIntent: TripIntent;
  }): string {
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
  ```

- [ ] Create `src/lib/ai/index.ts`:
  ```ts
  export * from './anthropic-client';
  export * from './prompts/intent-system';
  export * from './prompts/intent-refine';
  ```

- [ ] Commit: `feat(lib/ai): add IntentAgent prompts and barrel`

## Task 4: `IntentAgent` (`src/agents/intent-agent.ts`)

- [ ] Create `src/agents/intent-agent.ts`:
  ```ts
  import type { Agent, AgentContext } from '@core/agent';
  import { agentId } from '@core/ids';
  import { TripIntentSchema, type TripIntent } from '@core/trip-intent';
  import {
    INTENT_SYSTEM_PROMPT,
    INTENT_FEW_SHOTS,
  } from '@lib/ai/prompts/intent-system';
  import {
    buildComposePrompt,
    buildRefinePrompt,
  } from '@lib/ai/prompts/intent-refine';

  export interface IntentAgentInput {
    rawInput: string;
    priorIntent?: TripIntent;
  }

  export const INTENT_AGENT_ID = agentId('intent');
  export const INTENT_MODEL = 'claude-haiku-4-5';

  export const IntentAgent: Agent<IntentAgentInput, TripIntent> = {
    id: INTENT_AGENT_ID,
    name: 'Intent Agent',
    version: '0.1.0',

    async run(input: IntentAgentInput, ctx: AgentContext): Promise<TripIntent> {
      const startedAt = performance.now();

      ctx.emit.progress(input.priorIntent ? 'Adjusting your trip' : 'Reading your trip');

      const userPrompt = input.priorIntent
        ? buildRefinePrompt({ rawInput: input.rawInput, priorIntent: input.priorIntent })
        : buildComposePrompt(input.rawInput);

      const system = `${INTENT_SYSTEM_PROMPT}\n\n${INTENT_FEW_SHOTS}`;

      const intent = await ctx.modelClient.generate({
        model: INTENT_MODEL,
        system,
        messages: [{ role: 'user', content: userPrompt }],
        responseSchema: TripIntentSchema,
        cacheKey: 'intent-extraction-v1',
        maxTokens: 2048,
        temperature: 0.2,
      });

      // Defensive: even though the model emitted a tool_use that the SDK
      // validated against the JSON schema, re-validate against the
      // authoritative Zod schema. zodToJsonSchema can drift across versions.
      const parsed = TripIntentSchema.parse(intent);

      // Hard rule (spec §3.1): rawInput is preserved verbatim, regardless
      // of what the model emitted. Models occasionally rewrite or
      // truncate; we own this field.
      const result: TripIntent = { ...parsed, rawInput: input.rawInput };

      const durationMs = Math.round(performance.now() - startedAt);
      ctx.traceLogger.recordAgentRun(INTENT_AGENT_ID, input, result, durationMs);

      return result;
    },
  };
  ```

- [ ] Update `src/agents/index.ts`:
  ```ts
  // Layer: agents
  // Deps: core, lib

  export * from './intent-agent';
  ```

- [ ] Commit: `feat(agents): add IntentAgent for compose + refine flows`

## Task 5: `MockModelClient` test helper

- [ ] Create `tests/helpers/mock-model-client.ts`:
  ```ts
  import type {
    GenerateRequest,
    ModelClient,
    StreamChunk,
    StreamRequest,
  } from '@core/model-client';

  type GenerateHandler = (req: GenerateRequest<unknown>) => unknown;
  type StreamHandler = (req: StreamRequest) => AsyncIterable<StreamChunk>;

  /**
   * Test double for ModelClient. Tests configure responses up-front via
   * .respondGenerate()/.respondStream() and assert via .calls.
   */
  export class MockModelClient implements ModelClient {
    private generateHandler: GenerateHandler | null = null;
    private streamHandler: StreamHandler | null = null;

    readonly calls: {
      generate: GenerateRequest<unknown>[];
      stream: StreamRequest[];
    } = { generate: [], stream: [] };

    respondGenerate(handler: GenerateHandler): this {
      this.generateHandler = handler;
      return this;
    }

    respondStream(handler: StreamHandler): this {
      this.streamHandler = handler;
      return this;
    }

    reset(): void {
      this.generateHandler = null;
      this.streamHandler = null;
      this.calls.generate.length = 0;
      this.calls.stream.length = 0;
    }

    async generate<T>(req: GenerateRequest<T>): Promise<T> {
      this.calls.generate.push(req as GenerateRequest<unknown>);
      if (!this.generateHandler) {
        throw new Error(
          'MockModelClient: no generate handler configured. Call .respondGenerate(handler) first.',
        );
      }
      const result = await Promise.resolve(this.generateHandler(req as GenerateRequest<unknown>));
      if (req.responseSchema) {
        const parsed = req.responseSchema.safeParse(result);
        if (!parsed.success) {
          throw new Error(`MockModelClient: response failed schema: ${parsed.error.message}`);
        }
        return parsed.data;
      }
      return result as T;
    }

    async *stream(req: StreamRequest): AsyncIterable<StreamChunk> {
      this.calls.stream.push(req);
      if (!this.streamHandler) {
        throw new Error(
          'MockModelClient: no stream handler configured. Call .respondStream(handler) first.',
        );
      }
      yield* this.streamHandler(req);
    }
  }
  ```

## Task 6: IntentAgent unit tests

- [ ] Create `tests/intent-agent.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { IntentAgent } from '@/agents/intent-agent';
  import type { AgentContext } from '@core/agent';
  import { turnId } from '@core/ids';
  import type { TripIntent } from '@core/trip-intent';
  import { MockModelClient } from './helpers/mock-model-client';

  function fakeContext(client: MockModelClient): AgentContext {
    return {
      turnId: turnId('t-test'),
      signal: new AbortController().signal,
      emit: {
        progress: () => {},
        explanation: () => {},
      },
      modelClient: client,
      traceLogger: {
        recordEvent: () => {},
        recordAgentRun: () => {},
      },
    };
  }

  const validIntent: TripIntent = {
    destinations: [{ kind: 'curated', name: 'Italy', country: 'IT' }],
    dates: { kind: 'unspecified' },
    duration: { nights: 7, flexible: false },
    travelers: { adults: 2, children: { count: 2 }, infants: 0, groupKind: 'family' },
    budget: { kind: 'total', amount: 6000, currency: 'USD', flexibility: 'flexible' },
    vibe: { tags: ['walkable', 'family-friendly', 'avoid-tourist-traps'] },
    preferences: { amenities: [], avoid: [] },
    caveats: [],
    rawInput: 'this will be overwritten by the agent',
  };

  describe('IntentAgent', () => {
    it('returns the model output validated by TripIntentSchema', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      const result = await IntentAgent.run(
        { rawInput: 'Italy 7 days, family of 4, walkable, no tourist traps' },
        fakeContext(client),
      );
      expect(result.destinations[0]?.country).toBe('IT');
      expect(result.travelers.groupKind).toBe('family');
    });

    it('overwrites rawInput on the result with the input rawInput verbatim', async () => {
      const original = 'Italy 7 days, family of 4';
      const client = new MockModelClient().respondGenerate(() => validIntent);
      const result = await IntentAgent.run({ rawInput: original }, fakeContext(client));
      expect(result.rawInput).toBe(original);
      expect(result.rawInput).not.toBe(validIntent.rawInput);
    });

    it('passes responseSchema through to the model client (tool-use enforcement)', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      await IntentAgent.run({ rawInput: 'whatever' }, fakeContext(client));
      const call = client.calls.generate[0];
      expect(call?.responseSchema).toBeDefined();
    });

    it('uses claude-haiku-4-5 by default', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      await IntentAgent.run({ rawInput: 'whatever' }, fakeContext(client));
      expect(client.calls.generate[0]?.model).toBe('claude-haiku-4-5');
    });

    it('builds a refine prompt when priorIntent is provided', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      const prior: TripIntent = { ...validIntent, rawInput: 'original prompt' };
      await IntentAgent.run({ rawInput: 'less touristy', priorIntent: prior }, fakeContext(client));
      const userMsg = client.calls.generate[0]?.messages[0]?.content ?? '';
      expect(userMsg).toContain('REFINING');
      expect(userMsg).toContain('less touristy');
    });

    it('emits progress with appropriate label', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      const messages: string[] = [];
      const ctx: AgentContext = {
        ...fakeContext(client),
        emit: { progress: (m) => messages.push(m), explanation: () => {} },
      };
      await IntentAgent.run({ rawInput: 'a' }, ctx);
      expect(messages[0]).toMatch(/Reading|trip/);

      messages.length = 0;
      await IntentAgent.run({ rawInput: 'b', priorIntent: validIntent }, ctx);
      expect(messages[0]).toMatch(/Adjusting/);
    });

    it('records the agent run via traceLogger', async () => {
      const client = new MockModelClient().respondGenerate(() => validIntent);
      const runs: { agent: string; durationMs: number }[] = [];
      const ctx: AgentContext = {
        ...fakeContext(client),
        traceLogger: {
          recordEvent: () => {},
          recordAgentRun: (agent, _input, _output, durationMs) =>
            runs.push({ agent, durationMs }),
        },
      };
      await IntentAgent.run({ rawInput: 'a' }, ctx);
      expect(runs.length).toBe(1);
      expect(runs[0]?.agent).toBe('intent');
      expect(runs[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('rejects model output that fails schema', async () => {
      const client = new MockModelClient().respondGenerate(() => ({ destinations: 'not-array' }));
      await expect(IntentAgent.run({ rawInput: 'a' }, fakeContext(client))).rejects.toThrow();
    });
  });
  ```

- [ ] Run `pnpm test` - expect 8 new tests + the existing 33.
- [ ] Commit: `test(intent-agent): unit tests with MockModelClient covering compose + refine`

## Task 7: Live API integration test (gated)

- [ ] Create `tests/integration/anthropic-client.live.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { AnthropicModelClient } from '@/lib/ai/anthropic-client';
  import { z } from 'zod';

  const SHOULD_RUN = process.env.RUN_LIVE_API_TESTS === '1' && !!process.env.ANTHROPIC_API_KEY;

  describe.skipIf(!SHOULD_RUN)('AnthropicModelClient (live)', () => {
    it('completes a structured-output round-trip', async () => {
      const client = new AnthropicModelClient();
      const Schema = z.object({
        country: z.string().length(2),
        cityCount: z.number().int().min(1),
      });
      const result = await client.generate({
        model: 'claude-haiku-4-5',
        system: 'Return a country and the number of major cities you can name there.',
        messages: [{ role: 'user', content: 'Italy.' }],
        responseSchema: Schema,
        maxTokens: 256,
      });
      expect(result.country).toMatch(/^[A-Z]{2}$/);
      expect(result.cityCount).toBeGreaterThan(0);
    }, 30_000);

    it('streams tokens', async () => {
      const client = new AnthropicModelClient();
      const chunks: string[] = [];
      let finished = false;
      for await (const chunk of client.stream({
        model: 'claude-haiku-4-5',
        system: 'Be concise.',
        messages: [{ role: 'user', content: 'Say "hello, world" exactly.' }],
        maxTokens: 32,
      })) {
        if (chunk.kind === 'text') chunks.push(chunk.text);
        if (chunk.kind === 'finish') finished = true;
      }
      expect(chunks.join('')).toContain('hello');
      expect(finished).toBe(true);
    }, 30_000);
  });
  ```

- [ ] Create `tests/integration/intent-agent.eval.test.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { readFileSync } from 'node:fs';
  import { resolve } from 'node:path';
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
  ```

- [ ] Commit: `test(integration): add gated live API tests for AnthropicModelClient and IntentAgent eval`

## Task 8: Final pipeline + tag

- [ ] Run:
  ```bash
  pnpm format
  pnpm typecheck
  pnpm lint
  pnpm format:check
  pnpm test
  pnpm build
  ```
- [ ] Tag:
  ```bash
  git tag -a slice-a4 -m "Slice A4 complete: AnthropicModelClient + IntentAgent + eval baseline"
  ```
- [ ] After A4 ships, write the Slice A5 plan (Orchestrator + Streaming Protocol).

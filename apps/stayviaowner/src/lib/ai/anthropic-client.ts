import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type {
  GenerateRequest,
  GenerateWithMetaResult,
  ModelClient,
  ModelMessage,
  ModelMeta,
  StreamChunk,
  StreamRequest,
} from '@core/model-client';

// Anthropic's messages API only accepts 'user' / 'assistant' roles. Our
// ModelMessage interface allows 'system' for ergonomics, but in practice
// system content travels via the top-level `system` field. We drop any
// 'system'-roled messages here - IntentAgent and friends always pass
// system text via req.system anyway.
function toMessageParams(messages: readonly ModelMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        m.role === 'user' || m.role === 'assistant',
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

export class AnthropicClientError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'AnthropicClientError';
  }
}

/**
 * AnthropicModelClient - implementation of the ModelClient interface backed
 * by @anthropic-ai/sdk. Slice A4. Slice B can wrap with a RoutedModelClient
 * that picks providers per-agent.
 *
 * - generate<T>: uses tool-use to enforce structured output when a
 *   responseSchema is provided; otherwise returns the assistant text cast
 *   to T (callers should set T = string).
 * - stream: adapts the SDK's stream events into our StreamChunk union for
 *   the orchestrator's JSONL pipeline (Slice A5).
 *
 * Prompt caching: the system text is wrapped in a single content block with
 * cache_control: ephemeral so the system prompt + few-shots are reused
 * across turns. Cache hits show up in the StreamChunk.finish.usage
 * .cacheHitTokens.
 */
export class AnthropicModelClient implements ModelClient {
  private readonly client: Anthropic;

  constructor(opts: { apiKey?: string } = {}) {
    const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
    // Treat empty-string as "missing." A parent-shell `ANTHROPIC_API_KEY=""`
    // would otherwise win over .env.local (Node's dotenv loader respects
    // existing process.env), and the failure mode is confusing. Better
    // to fall through to the same "not set" error message.
    if (!apiKey || apiKey.length === 0) {
      throw new AnthropicClientError(
        'ANTHROPIC_API_KEY is not set (or is an empty string). Add a value to .env.local - note that a parent-shell empty-string export will override it.',
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async generate<T>(req: GenerateRequest<T>): Promise<T> {
    const { result } = await this.generateInternal(req);
    return result;
  }

  async generateWithMeta<T>(req: GenerateRequest<T>): Promise<GenerateWithMetaResult<T>> {
    return this.generateInternal(req);
  }

  /**
   * Single implementation backing both `generate` (drops meta) and
   * `generateWithMeta`. Branches on `responseSchema` for tool-use vs
   * plain-text paths; both paths return usage from the Anthropic
   * response object.
   */
  private async generateInternal<T>(req: GenerateRequest<T>): Promise<GenerateWithMetaResult<T>> {
    const systemBlocks = req.system
      ? [
          {
            type: 'text' as const,
            text: req.system,
            cache_control: { type: 'ephemeral' as const },
          },
        ]
      : undefined;

    if (req.responseSchema) {
      const jsonSchema = z.toJSONSchema(req.responseSchema, {
        target: 'draft-7',
      }) as Record<string, unknown>;

      const tool = {
        name: 'emit_structured_output',
        description: 'Emit the structured output that satisfies the schema.',
        input_schema: { ...jsonSchema, type: 'object' as const },
      };

      const startedAt = performance.now();
      try {
        const resp = await this.client.messages.create({
          model: req.model,
          ...(systemBlocks ? { system: systemBlocks } : {}),
          messages: toMessageParams(req.messages),
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

        // Apply caller-supplied coercion before strict Zod parse - fixes
        // common tool-use shortcuts (e.g. discriminated-union variants
        // emitted as bare strings).
        const candidate = req.coerce ? req.coerce(toolUse.input) : toolUse.input;
        const parsed = req.responseSchema.safeParse(candidate);
        if (!parsed.success) {
          // Log the raw model output so a caller's fallback can also
          // see what the model actually emitted. Truncated to avoid
          // dumping multi-page JSON to logs.
          console.warn('[anthropic-client] tool output failed schema validation', {
            model: req.model,
            issues: parsed.error.issues.slice(0, 3),
            raw: JSON.stringify(toolUse.input).slice(0, 600),
          });
          throw new AnthropicClientError(
            `Tool output failed schema validation: ${parsed.error.message}`,
          );
        }
        const durationMs = Math.round(performance.now() - startedAt);
        const meta = this.usageToMeta(req.model, resp.usage);
        console.info('[anthropic-client] generate ok', {
          model: req.model,
          durationMs,
          tokensIn: meta.tokensIn,
          tokensOut: meta.tokensOut,
          cacheHit: meta.cacheHit ?? false,
        });
        return { result: parsed.data, modelMeta: meta };
      } catch (err) {
        if (err instanceof AnthropicClientError) throw err;
        throw new AnthropicClientError('Anthropic generate() failed', err);
      }
    }

    try {
      const resp = await this.client.messages.create({
        model: req.model,
        ...(systemBlocks ? { system: systemBlocks } : {}),
        messages: toMessageParams(req.messages),
        max_tokens: req.maxTokens ?? 1024,
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      });
      const textBlock = resp.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );
      return {
        result: (textBlock?.text ?? '') as T,
        modelMeta: this.usageToMeta(req.model, resp.usage),
      };
    } catch (err) {
      throw new AnthropicClientError('Anthropic generate() failed', err);
    }
  }

  private usageToMeta(model: string, usage: Anthropic.Usage | undefined): ModelMeta {
    const tokensIn = usage?.input_tokens ?? 0;
    const tokensOut = usage?.output_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens;
    const meta: ModelMeta = { model, tokensIn, tokensOut };
    if (cacheRead !== null && cacheRead !== undefined && cacheRead > 0) {
      meta.cacheHit = true;
    }
    return meta;
  }

  async *stream(req: StreamRequest): AsyncIterable<StreamChunk> {
    const systemBlocks = req.system
      ? [
          {
            type: 'text' as const,
            text: req.system,
            cache_control: { type: 'ephemeral' as const },
          },
        ]
      : undefined;

    const stream = this.client.messages.stream({
      model: req.model,
      ...(systemBlocks ? { system: systemBlocks } : {}),
      messages: toMessageParams(req.messages),
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
      const cacheHit = final.usage.cache_read_input_tokens;
      const usage = {
        inputTokens: final.usage.input_tokens,
        outputTokens: final.usage.output_tokens,
        ...(cacheHit !== null && cacheHit !== undefined ? { cacheHitTokens: cacheHit } : {}),
      };
      yield { kind: 'finish', reason, usage };
    } catch (err) {
      yield { kind: 'finish', reason: 'error' };
      throw new AnthropicClientError('Anthropic stream() failed', err);
    }
  }
}

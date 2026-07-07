import type { ZodType } from 'zod';

export type ModelId = 'claude-haiku-4-5' | 'claude-sonnet-4-6' | 'claude-opus-4-7' | (string & {}); // future-extensible without losing autocomplete on known IDs

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateRequest<T> {
  model: ModelId;
  system?: string;
  messages: ModelMessage[];
  responseSchema?: ZodType<T>;
  cacheKey?: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * Optional pre-validation hook. The client applies this to the raw
   * tool-use input before running `responseSchema.safeParse`. Use it
   * for schema-specific coercion the model occasionally fumbles - e.g.,
   * expanding bare-string `"unspecified"` into `{kind: "unspecified"}`
   * for discriminated-union variants. Idempotent + side-effect-free.
   */
  coerce?: (raw: unknown) => unknown;
}

export interface StreamRequest {
  model: ModelId;
  system?: string;
  messages: ModelMessage[];
  cacheKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export type StreamChunk =
  | { kind: 'text'; text: string }
  | {
      kind: 'finish';
      reason: 'end_turn' | 'max_tokens' | 'error';
      usage?: ModelUsage;
    };

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheHitTokens?: number;
}

/**
 * Per-call usage info reported alongside a generation result. Used by
 * the trace logger pipeline (Slice B7) to compute cost + populate the
 * /admin dashboard. Optional fields stay undefined when the provider
 * doesn't report them.
 */
export interface ModelMeta {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cacheHit?: boolean;
}

export interface GenerateWithMetaResult<T> {
  result: T;
  modelMeta: ModelMeta;
}

export interface ModelClient {
  /**
   * Convenience: returns just the parsed result. Same surface as Slice
   * A - every existing call site stays unchanged.
   */
  generate<T>(req: GenerateRequest<T>): Promise<T>;

  /**
   * Returns the result alongside per-call usage. Callers that want to
   * surface cost/latency in traces use this; callers that don't care
   * keep using `generate`. Both share an implementation in real
   * clients - the difference is what the caller chooses to receive.
   */
  generateWithMeta<T>(req: GenerateRequest<T>): Promise<GenerateWithMetaResult<T>>;

  stream(req: StreamRequest): AsyncIterable<StreamChunk>;
}

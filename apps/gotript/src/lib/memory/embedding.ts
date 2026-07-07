/**
 * EmbeddingProvider - turns a string into a unit vector for similarity
 * search. Two implementations exist:
 *
 *   - BagOfWordsEmbedding (this file): deterministic, local, free.
 *     Tokenizes on whitespace + punctuation, lowercases, hashes tokens
 *     into a fixed-dimension sparse vector, L2-normalizes. Good enough
 *     for the prompt sizes we're working with; the dev demo gets
 *     useful retrieval without keys.
 *
 *   - AnthropicEmbedding (anthropic-embedding.ts): real semantic
 *     embeddings from the Anthropic API. Opt-in via
 *     STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS=1 - unconditional usage isn't
 *     free (per-call cost) so we make it explicit.
 */

export interface EmbeddingProvider {
  /** Output dimension. Stable for the lifetime of the provider. */
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

/**
 * Naive bag-of-words → fixed-dim sparse vector. Token hashing maps each
 * token to a deterministic index; counts accumulate; the result is
 * L2-normalized so cosine similarity equals dot product.
 *
 * Why a hash bucket and not a TF-IDF dictionary: TF-IDF needs a corpus,
 * and we don't have one ahead of time. The hash collisions add noise
 * but are stable, which is what cosine retrieval needs.
 */
export class BagOfWordsEmbedding implements EmbeddingProvider {
  readonly dimensions: number;

  constructor(dimensions: number = 256) {
    if (dimensions < 32) throw new Error('BagOfWordsEmbedding dimensions too small');
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    return this.embedSync(text);
  }

  /** Synchronous variant used by tests; the async signature on the
   *  interface keeps the door open for HTTP-backed providers. */
  embedSync(text: string): number[] {
    const v = new Array<number>(this.dimensions).fill(0);
    const tokens = tokenize(text);
    if (tokens.length === 0) return v;
    for (const tok of tokens) {
      const idx = hashToken(tok) % this.dimensions;
      v[idx] = (v[idx] ?? 0) + 1;
    }
    return l2Normalize(v);
  }
}

/** Cosine similarity in [-1, 1]. Both inputs assumed L2-normalized. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  // Clamp tiny floating-point drift past ±1.
  if (dot > 1) return 1;
  if (dot < -1) return -1;
  return dot;
}

// ============== Internals ==============

const TOKEN_SPLIT = /[^a-z0-9]+/g;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .filter((t) => t.length >= 2);
}

/** djb2-style string hash. Stable across runs + platforms. */
function hashToken(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) + h + s.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return h >>> 0; // force unsigned
}

function l2Normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  if (sum === 0) return v;
  const norm = Math.sqrt(sum);
  return v.map((x) => x / norm);
}

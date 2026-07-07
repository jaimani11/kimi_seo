import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AnthropicModelClient } from '@/lib/ai/anthropic-client';

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

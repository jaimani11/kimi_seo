import { describe, expect, it } from 'vitest';
import { MoodSnapshotAgent } from '@/agents/mood-snapshot-agent';
import { turnId } from '@core/ids';
import type { AgentContext } from '@core/agent';
import { MockModelClient } from './helpers/mock-model-client';

function fakeContext(client: MockModelClient): AgentContext {
  return {
    turnId: turnId('t-test'),
    signal: new AbortController().signal,
    emit: { progress: () => {}, explanation: () => {} },
    modelClient: client,
    traceLogger: { recordEvent: () => {}, recordAgentRun: () => {} },
  };
}

describe('MoodSnapshotAgent', () => {
  it('returns curated mood for a known Italian destination (no LLM call)', async () => {
    const client = new MockModelClient(); // no .respondGenerate - would throw if called
    const result = await MoodSnapshotAgent.run(
      { destination: { kind: 'curated', name: 'Tuscany', country: 'IT' } },
      fakeContext(client),
    );
    expect(result.source).toBe('curated');
    expect(result.text).toContain('Golden-hour');
    expect(client.calls.generate.length).toBe(0);
  });

  it('falls back to LLM for an unknown destination', async () => {
    const client = new MockModelClient().respondGenerate(() => ({
      text: 'Cobblestone alleys and neon signs at midnight.',
    }));
    const result = await MoodSnapshotAgent.run(
      { destination: { kind: 'synthesized', name: 'Tokyo', country: 'JP' } },
      fakeContext(client),
    );
    expect(result.source).toBe('llm');
    expect(result.text).toContain('Cobblestone');
    expect(client.calls.generate.length).toBe(1);
  });

  it('retries when LLM emits banned cliché, then succeeds', async () => {
    let attempt = 0;
    const client = new MockModelClient().respondGenerate(() => {
      attempt += 1;
      return attempt === 1
        ? { text: 'A magical hidden gem awaits.' }
        : { text: 'Lemon trees and sea salt at noon.' };
    });
    const result = await MoodSnapshotAgent.run(
      { destination: { kind: 'synthesized', name: 'Sicily', country: 'IT' } },
      fakeContext(client),
    );
    expect(result.text).toContain('Lemon trees');
    expect(client.calls.generate.length).toBe(2);
  });

  it('throws after two banned-word attempts', async () => {
    const client = new MockModelClient().respondGenerate(() => ({
      text: 'A magical journey to discover the unforgettable.',
    }));
    await expect(
      MoodSnapshotAgent.run(
        { destination: { kind: 'synthesized', name: 'Bali', country: 'ID' } },
        fakeContext(client),
      ),
    ).rejects.toThrow();
  });
});

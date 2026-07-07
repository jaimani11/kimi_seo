import { describe, expect, it } from 'vitest';
import { OrchestratorEventSchema } from '@core/orchestrator-event';

describe('OrchestratorEventSchema', () => {
  it('parses agent.step.started', () => {
    const e = {
      kind: 'agent.step.started',
      turnId: 't1',
      stepId: 's1',
      agentId: 'intent',
      label: 'Reading your trip',
    };
    expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
  });

  it('parses turn.completed with partial report', () => {
    const e = {
      kind: 'turn.completed',
      turnId: 't1',
      durationMs: 2400,
      partial: {
        missingComponents: ['mood'],
        degradedComponents: [{ component: 'weather', reason: 'timeout' }],
      },
    };
    expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
  });

  it('rejects unknown kind', () => {
    const e = { kind: 'totally.made.up', turnId: 't1' };
    expect(() => OrchestratorEventSchema.parse(e)).toThrow();
  });

  it('rejects agent.step.completed missing durationMs', () => {
    const e = { kind: 'agent.step.completed', turnId: 't1', stepId: 's1' };
    expect(() => OrchestratorEventSchema.parse(e)).toThrow();
  });

  it('parses concierge.memory.hint with confidence', () => {
    const e = {
      kind: 'concierge.memory.hint',
      turnId: 't1',
      message: 'You seem to prefer slower, walkable destinations.',
      signalKey: 'pace',
      confidence: 0.7,
    };
    expect(() => OrchestratorEventSchema.parse(e)).not.toThrow();
  });
});

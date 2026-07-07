import { describe, expect, it } from 'vitest';
import { ConciergeRequestSchema } from '@core/concierge-request';

describe('ConciergeRequestSchema', () => {
  const valid = {
    sessionId: 'anon_abc',
    turnId: 't1',
    type: 'compose',
    input: { rawInput: 'Italy 7 days family' },
    clientCapabilities: {
      supportsAdaptationDelta: true,
      supportsMoodSnapshot: true,
      supportsMemoryHint: true,
    },
  };

  it('parses a valid compose request', () => {
    expect(() => ConciergeRequestSchema.parse(valid)).not.toThrow();
  });

  it('rejects empty rawInput', () => {
    const bad = { ...valid, input: { rawInput: '' } };
    expect(() => ConciergeRequestSchema.parse(bad)).toThrow();
  });

  it('rejects compareSet over 3 entries', () => {
    const bad = {
      ...valid,
      input: { rawInput: 'x', compareSet: ['a', 'b', 'c', 'd'] },
    };
    expect(() => ConciergeRequestSchema.parse(bad)).toThrow();
  });

  it('parses a refine request with priorProposalRef', () => {
    const refine = {
      ...valid,
      type: 'refine',
      input: {
        rawInput: 'less touristy',
        priorProposalRef: {
          turnId: 't0',
          proposalId: 'p_abc',
          generatedAt: new Date().toISOString(),
          summary: {
            destinationName: 'Tuscany',
            nights: 7,
            heroStayName: 'Villa di Geggiano',
          },
        },
      },
    };
    expect(() => ConciergeRequestSchema.parse(refine)).not.toThrow();
  });
});

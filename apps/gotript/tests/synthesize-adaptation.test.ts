import { describe, expect, it } from 'vitest';
import { synthesizeAdaptationNotes } from '@/orchestrator/synthesize-adaptation';
import type { IntentDelta } from '@core/intent-delta';

describe('synthesizeAdaptationNotes', () => {
  it('returns empty when no changes', () => {
    const delta: IntentDelta = { added: {}, changed: [], removed: [] };
    expect(synthesizeAdaptationNotes(delta)).toEqual([]);
  });

  it('emits up notes for added vibe tags', () => {
    const delta: IntentDelta = {
      added: {},
      changed: [
        {
          key: 'vibe',
          before: { tags: ['walkable'] },
          after: { tags: ['walkable', 'avoid-tourist-traps'] },
        },
      ],
      removed: [],
    };
    const notes = synthesizeAdaptationNotes(delta);
    expect(notes.length).toBe(1);
    expect(notes[0]?.direction).toBe('up');
    expect(notes[0]?.signal).toBe('avoid-tourist-traps');
    expect(notes[0]?.description).toContain('avoid tourist traps');
  });

  it('emits down notes for removed vibe tags', () => {
    const delta: IntentDelta = {
      added: {},
      changed: [
        {
          key: 'vibe',
          before: { tags: ['walkable', 'fast-paced'] },
          after: { tags: ['walkable'] },
        },
      ],
      removed: [],
    };
    const notes = synthesizeAdaptationNotes(delta);
    expect(notes.some((n) => n.direction === 'down' && n.signal === 'fast-paced')).toBe(true);
  });

  it('emits a budget note when budget changed', () => {
    const delta: IntentDelta = {
      added: {},
      changed: [{ key: 'budget', before: { kind: 'unspecified' }, after: { kind: 'total' } }],
      removed: [],
    };
    const notes = synthesizeAdaptationNotes(delta);
    expect(notes.some((n) => n.signal === 'budget')).toBe(true);
  });
});

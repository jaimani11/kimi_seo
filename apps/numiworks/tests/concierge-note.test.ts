import { describe, expect, it } from 'vitest';
import { buildConciergeNote } from '@/features/site/concierge-note';

describe('buildConciergeNote', () => {
  it('returns null for empty queries', () => {
    expect(buildConciergeNote('')).toBeNull();
    expect(buildConciergeNote('   ')).toBeNull();
  });

  it('matches a known city', () => {
    const note = buildConciergeNote('tokyo food tour');
    expect(note).not.toBeNull();
    expect(note!.body).toContain('Tokyo');
    expect(note!.planQuery).toBe('Tokyo, Japan');
  });

  it('matches an activity when no city is present', () => {
    const note = buildConciergeNote('cooking class');
    expect(note).not.toBeNull();
    expect(note!.body).toMatch(/food|eat/i);
    // Falls back to using the raw query as the plan destination.
    expect(note!.planQuery).toBe('cooking class');
  });

  it('returns a generic-but-warm fallback for unknown queries', () => {
    const note = buildConciergeNote('Mongolia steppes');
    expect(note).not.toBeNull();
    expect(note!.body).toMatch(/Viator|live/i);
    expect(note!.planQuery).toBe('Mongolia steppes');
  });

  it('city detection beats activity detection when both are present', () => {
    const note = buildConciergeNote('cooking class Rome');
    // The Rome hint wins — planQuery is the canonical city, even when
    // the query also mentions an activity keyword.
    expect(note!.planQuery).toBe('Rome, Italy');
  });
});

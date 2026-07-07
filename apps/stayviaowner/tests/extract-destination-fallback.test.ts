import { describe, expect, it } from 'vitest';
import { extractDestinationFallback } from '@/orchestrator/extract-destination-fallback';

/**
 * Behavioral guarantees: when the IntentAgent returns an empty
 * destinations array (which happens for terse prompts where the
 * model can't pick a single city), this fallback should still
 * resolve a destination so the user doesn't get bounced back with
 * a "tell me where" message.
 */

describe('extractDestinationFallback', () => {
  it('extracts country name from "Austria ski trip for 6 people"', () => {
    const out = extractDestinationFallback('Austria ski trip for 6 people');
    expect(out).toEqual({ name: 'Austria', country: 'AT' });
  });

  it('extracts city name from "Vancouver luxury weekend near restaurants"', () => {
    const out = extractDestinationFallback('Vancouver luxury weekend near restaurants');
    expect(out).toEqual({ name: 'Vancouver', country: 'CA' });
  });

  it('extracts known regions like Tuscany', () => {
    const out = extractDestinationFallback('Tuscany, slow and walkable');
    expect(out).toEqual({ name: 'Tuscany', country: 'IT' });
  });

  it('matches multi-word destinations like "New York"', () => {
    const out = extractDestinationFallback('New York for a long weekend');
    expect(out).toEqual({ name: 'New York', country: 'US' });
  });

  it('matches multi-word country names like "United Kingdom"', () => {
    const out = extractDestinationFallback('Trip to the United Kingdom');
    expect(out).toEqual({ name: 'United Kingdom', country: 'GB' });
  });

  it('case-insensitive match', () => {
    const out = extractDestinationFallback('tokyo for a long weekend');
    expect(out).toEqual({ name: 'Tokyo', country: 'JP' });
  });

  it('returns null when no recognizable destination is in the input', () => {
    const out = extractDestinationFallback('something cool somewhere fun');
    expect(out).toBeNull();
  });

  it('returns null on empty input', () => {
    expect(extractDestinationFallback('')).toBeNull();
    expect(extractDestinationFallback('   ')).toBeNull();
  });

  it('prefers 2-word phrase over single tokens when both could match', () => {
    // "new" alone wouldn't match anything; "new-york" matches.
    const out = extractDestinationFallback('Going to New York next month');
    expect(out?.country).toBe('US');
  });
});

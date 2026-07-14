import { describe, expect, it } from 'vitest';
import { redactPii, redactPiiText } from '@/lib/privacy/redact-pii';

describe('redactPii — catches common PII formats', () => {
  it('redacts email addresses', () => {
    const r = redactPii('email me at jane.doe+trip@example.co.uk please');
    expect(r.text).toContain('[redacted-email]');
    expect(r.text).not.toContain('jane.doe');
    expect(r.kinds).toContain('email');
  });

  it('redacts a Luhn-valid payment card, spaced or joined', () => {
    expect(redactPiiText('card 4242 4242 4242 4242')).toContain('[redacted-card]');
    expect(redactPiiText('card 4242424242424242')).toContain('[redacted-card]');
  });

  it('redacts phone numbers (intl, dashed, parenthesized)', () => {
    expect(redactPiiText('call +1 415 555 0132')).toContain('[redacted-phone]');
    expect(redactPiiText('call 415-555-0132')).toContain('[redacted-phone]');
    expect(redactPiiText('call (415) 555-0132')).toContain('[redacted-phone]');
  });

  it('redacts an SSN and a passport-shaped id', () => {
    expect(redactPiiText('ssn 123-45-6789')).toContain('[redacted-id]');
    expect(redactPiiText('passport AB1234567')).toContain('[redacted-id]');
  });

  it('redacts a street address', () => {
    expect(redactPiiText('we live at 221 Baker Street')).toContain('[redacted-address]');
  });

  it('redacts a reservation code only when keyword-gated and containing a digit', () => {
    const r = redactPii('booking ref XY7Q2B for the hotel');
    expect(r.text).toContain('[redacted-reservation]');
    expect(r.text).toContain('booking'); // keyword text is kept, only the code goes
  });

  it('reports fired categories without leaking raw values', () => {
    const r = redactPii('email a@b.com and call +1 415 555 0132');
    expect(new Set(r.kinds)).toEqual(new Set(['email', 'phone']));
    expect(r.redactions).toBe(2);
    expect(JSON.stringify(r.kinds)).not.toContain('415');
  });
});

describe('redactPii — does NOT clobber ordinary trip prose', () => {
  const survives = [
    '5 days in Rome, foodie, low-key',
    '2 adults and 1 child, ages 4 and 7',
    'budget around $3,000 for the week',
    'traveling in March 2026 for our anniversary',
    'a 3-night stay near the Colosseum',
    'we want a villa with a pool for 8 people',
    'no museums, more relaxing, keep the house',
  ];

  it('leaves normal trip descriptions unchanged', () => {
    for (const s of survives) {
      const r = redactPii(s);
      expect(r.text).toBe(s);
      expect(r.redactions).toBe(0);
    }
  });

  it('does not treat "booking flights" as a reservation code (no digit)', () => {
    expect(redactPiiText('booking flights for next week')).toBe('booking flights for next week');
  });

  it('handles empty/whitespace input', () => {
    expect(redactPii('').text).toBe('');
    expect(redactPii('   ').redactions).toBe(0);
  });
});

describe('redactPii — documented limitations (honest)', () => {
  it('is best-effort, not a guarantee: never throws, even on odd input', () => {
    // A long non-card / non-standard digit run is intentionally left to
    // conservative rules rather than aggressively guessed at.
    expect(() => redactPii('ref 12345678901234567 xyz')).not.toThrow();
    // Free-text names without a recognizable shape are NOT caught — this is a
    // known limitation; structured/normalized storage is the primary defense.
    expect(redactPiiText('my name is Alexandra')).toBe('my name is Alexandra');
  });
});

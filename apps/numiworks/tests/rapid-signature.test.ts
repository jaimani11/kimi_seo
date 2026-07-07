import { describe, expect, it } from 'vitest';
import { signRapidRequest, timingSafeEqualHex } from '@/providers/_shared/rapid-signature';

describe('signRapidRequest', () => {
  const creds = { apiKey: 'key_test', sharedSecret: 'shh_test_secret' };

  it('produces an EAN-prefixed Authorization header with the right shape', () => {
    const out = signRapidRequest(creds, 1_700_000_000);
    expect(out.authorization).toMatch(
      /^EAN APIKey=key_test,Signature=[0-9a-f]{128},timestamp=1700000000$/,
    );
    expect(out.signature).toMatch(/^[0-9a-f]{128}$/);
    expect(out.timestamp).toBe(1_700_000_000);
  });

  it('is deterministic for fixed creds + timestamp', () => {
    const a = signRapidRequest(creds, 1_700_000_000);
    const b = signRapidRequest(creds, 1_700_000_000);
    expect(a.signature).toEqual(b.signature);
    expect(a.authorization).toEqual(b.authorization);
  });

  it('signature changes when the timestamp moves by even 1 second', () => {
    const a = signRapidRequest(creds, 1_700_000_000);
    const b = signRapidRequest(creds, 1_700_000_001);
    expect(a.signature).not.toEqual(b.signature);
  });

  it('signature changes when the secret rotates', () => {
    const a = signRapidRequest(creds, 1_700_000_000);
    const b = signRapidRequest({ ...creds, sharedSecret: 'shh_rotated' }, 1_700_000_000);
    expect(a.signature).not.toEqual(b.signature);
  });

  it('produces a 128-char hex SHA-512 (right algorithm + format)', () => {
    const out = signRapidRequest({ apiKey: 'a', sharedSecret: 'b' }, 0);
    expect(out.signature).toMatch(/^[0-9a-f]{128}$/);
  });
});

describe('timingSafeEqualHex', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqualHex('deadbeef', 'deadbeef')).toBe(true);
  });

  it('returns false for differing strings of equal length', () => {
    expect(timingSafeEqualHex('deadbeef', 'deadc0de')).toBe(false);
  });

  it('returns false for differing lengths', () => {
    expect(timingSafeEqualHex('deadbeef', 'deadbeef00')).toBe(false);
  });
});

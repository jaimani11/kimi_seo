import { describe, expect, it } from 'vitest';
import {
  decodeAffiliateLink,
  encodeAffiliateLink,
  type AffiliateLinkPayload,
} from '@/lib/affiliate/link-encoder';

const sample: AffiliateLinkPayload = {
  url: 'https://www.expedia.com/Hotel-Search?destination=Tuscany&startDate=2026-09-01&endDate=2026-09-05&affcid=CID',
  providerId: 'mock-italy',
  stayId: 'mock-italy:borgo-sant-ambrogio',
  turnId: 't_test',
};

describe('encodeAffiliateLink + decodeAffiliateLink', () => {
  it('round-trips a payload through the base64url encoder', () => {
    const id = encodeAffiliateLink(sample);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet
    const decoded = decodeAffiliateLink(id);
    expect(decoded).toEqual(sample);
  });

  it('preserves only the optional fields actually present', () => {
    const payload: AffiliateLinkPayload = {
      url: 'https://www.expedia.com/x',
      providerId: 'expedia',
    };
    const id = encodeAffiliateLink(payload);
    const decoded = decodeAffiliateLink(id);
    expect(decoded).toEqual(payload);
  });

  it('rejects malformed base64url input', () => {
    expect(decodeAffiliateLink('not!valid!base64')).toBeNull();
  });

  it('rejects an empty id', () => {
    expect(decodeAffiliateLink('')).toBeNull();
  });

  it('rejects a non-JSON payload after base64url decode', () => {
    // Encode the literal string "hello" - valid base64url, invalid JSON.
    const id = Buffer.from('hello', 'utf8').toString('base64url');
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('rejects payloads missing required fields', () => {
    const id = Buffer.from(JSON.stringify({ p: 'expedia' }), 'utf8').toString('base64url');
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('rejects URLs that fail the host allowlist (defense against tampered ids)', () => {
    // A tampered payload pointing at an off-allowlist host.
    const id = Buffer.from(
      JSON.stringify({ u: 'https://attacker.example/phish', p: 'expedia' }),
      'utf8',
    ).toString('base64url');
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('rejects http:// (allowlist requires https)', () => {
    const id = Buffer.from(
      JSON.stringify({ u: 'http://www.expedia.com/Hotel-Search', p: 'expedia' }),
      'utf8',
    ).toString('base64url');
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('throws on encode if the URL is too long (cheap DoS guard)', () => {
    const huge = 'https://www.expedia.com/Hotel-Search?q=' + 'x'.repeat(2000);
    expect(() => encodeAffiliateLink({ url: huge, providerId: 'expedia' })).toThrow();
  });

  it('rejects oversized encoded ids on decode', () => {
    const id = 'a'.repeat(2000);
    expect(decodeAffiliateLink(id)).toBeNull();
  });

  it('encoded id is reasonably compact (typical < 280 chars)', () => {
    // Sample carries a full Expedia URL plus turnId; compact form
    // sits at ~240 chars. Bound at 280 to leave headroom.
    const id = encodeAffiliateLink(sample);
    expect(id.length).toBeLessThan(280);
  });
});

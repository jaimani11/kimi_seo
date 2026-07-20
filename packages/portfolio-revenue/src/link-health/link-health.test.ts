import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLink, checkLinks, type LinkPolicy } from './index.ts';

/**
 * Domain-neutral tests — generic hosts only (the package must never name a
 * travel provider). A property maps real hosts to this shape in its own layer.
 * `partner.example` = an allowed destination; `evil.example` = a forbidden one;
 * attribution requires a `ref` param OR a path-encoded `camref:` token.
 */
const POLICY: LinkPolicy = {
  id: 'demo',
  allowedHosts: ['partner.example', 'track.example'],
  forbiddenHosts: ['evil.example', 'other-partner.example'],
  requiredSignals: [{ key: 'ref', valuePattern: /^ABC123$/, note: 'attribution id' }],
};

test('passes a correctly-formed, tracked link on an allowed host', () => {
  const r = checkLink('https://www.partner.example/search?ref=ABC123&dest=Gatlinburg', POLICY);
  assert.equal(r.ok, true);
  assert.equal(r.code, 'ok');
});

test('flags a link that leaks to a forbidden host (most severe)', () => {
  const r = checkLink('https://evil.example/x?ref=ABC123', POLICY);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'leaked');
});

test('flags a link pointing at a host that is neither allowed nor forbidden', () => {
  const r = checkLink('https://random.example/x?ref=ABC123', POLICY);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'wrong-host');
});

test('flags an allowed host that lost its attribution param', () => {
  const r = checkLink('https://partner.example/search?dest=Gatlinburg', POLICY);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'untracked');
  assert.match(r.reasons[0] ?? '', /ref/);
});

test('flags an attribution param whose value does not match the pattern', () => {
  const r = checkLink('https://partner.example/search?ref=WRONG', POLICY);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'untracked');
});

test('accepts a path-encoded attribution id via the raw-href fallback', () => {
  const pathPolicy: LinkPolicy = {
    id: 'redirect',
    allowedHosts: ['track.example'],
    requiredSignals: [{ key: 'camref', valuePattern: /camref[:=]1110lFruB/ }],
  };
  const r = checkLink('https://track.example/click-101/camref:1110lFruB?u=partner.example', pathPolicy);
  assert.equal(r.ok, true);
});

test('rejects a malformed URL', () => {
  const r = checkLink('not a url', POLICY);
  assert.equal(r.code, 'malformed');
});

test('subdomain of an allowed host is allowed; subdomain of a forbidden host leaks', () => {
  assert.equal(checkLink('https://go.partner.example/?ref=ABC123', POLICY).ok, true);
  assert.equal(checkLink('https://go.evil.example/?ref=ABC123', POLICY).code, 'leaked');
});

test('checkLinks rolls up a report with per-code counts and only the failures', () => {
  const report = checkLinks(
    [
      'https://partner.example/?ref=ABC123', // ok
      'https://partner.example/?ref=WRONG', // untracked
      'https://evil.example/?ref=ABC123', // leaked
      'https://random.example/?ref=ABC123', // wrong-host
      'nope', // malformed
    ],
    POLICY,
  );
  assert.equal(report.total, 5);
  assert.equal(report.ok, 1);
  assert.equal(report.failed, 4);
  assert.equal(report.byCode.ok, 1);
  assert.equal(report.byCode.untracked, 1);
  assert.equal(report.byCode.leaked, 1);
  assert.equal(report.byCode['wrong-host'], 1);
  assert.equal(report.byCode.malformed, 1);
  assert.equal(report.failures.length, 4);
});

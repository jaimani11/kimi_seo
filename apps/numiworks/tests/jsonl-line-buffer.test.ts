import { describe, expect, it } from 'vitest';
import { JsonlLineBuffer } from '@/lib/streaming/jsonl-line-buffer';

const enc = new TextEncoder();
function bytes(s: string): Uint8Array {
  return enc.encode(s);
}

describe('JsonlLineBuffer', () => {
  it('returns complete lines; buffers the trailing partial', () => {
    const b = new JsonlLineBuffer();
    expect(b.push(bytes('{"a":1}\n{"b":2}\n{"c"'))).toEqual(['{"a":1}', '{"b":2}']);
    expect(b.push(bytes(':3}\n'))).toEqual(['{"c":3}']);
    expect(b.flush()).toEqual([]);
  });

  it('filters empty lines (newline-only frames)', () => {
    const b = new JsonlLineBuffer();
    expect(b.push(bytes('\n\n{"a":1}\n\n'))).toEqual(['{"a":1}']);
  });

  it('returns the trailing line on flush even without a final newline', () => {
    // This is the "stream cut off" case - server-side toJsonlStream
    // always appends '\n', but a flaky proxy or aborted middleware
    // could drop it. The buffer must not silently lose that last line.
    const b = new JsonlLineBuffer();
    expect(b.push(bytes('{"a":1}\n{"trailing"'))).toEqual(['{"a":1}']);
    expect(b.push(bytes(':true}'))).toEqual([]);
    expect(b.flush()).toEqual(['{"trailing":true}']);
  });

  it('preserves multi-byte UTF-8 sequences split across chunks', () => {
    // 'é' is two bytes in UTF-8 (0xC3 0xA9). Split at the boundary so
    // chunk 1 ends mid-codepoint. Without the streaming decoder, the
    // second chunk's first byte gets misinterpreted and the line is
    // garbage.
    const full = '{"city":"café"}\n';
    const fullBytes = enc.encode(full);
    // Split somewhere inside the 2-byte 'é'. enc('café') = ...c-a-f-0xC3-0xA9.
    // For "{" "city":"caf" then 0xC3 then 0xA9 then ...
    const splitAt = fullBytes.indexOf(0xc3) + 1; // after the first byte of 'é'
    expect(splitAt).toBeGreaterThan(0);
    const a = fullBytes.slice(0, splitAt);
    const c = fullBytes.slice(splitAt);

    const b = new JsonlLineBuffer();
    expect(b.push(a)).toEqual([]); // partial 'é' - no complete line yet
    expect(b.push(c)).toEqual([full.replace('\n', '')]);
  });

  it('flush drains any pending multi-byte tail (no final newline)', () => {
    const full = '{"city":"café"}';
    const fullBytes = enc.encode(full);
    const splitAt = fullBytes.indexOf(0xc3) + 1;
    const a = fullBytes.slice(0, splitAt);
    const c = fullBytes.slice(splitAt);

    const b = new JsonlLineBuffer();
    expect(b.push(a)).toEqual([]);
    expect(b.push(c)).toEqual([]);
    expect(b.flush()).toEqual([full]);
  });

  it('handles a single line that arrives across many tiny chunks', () => {
    const b = new JsonlLineBuffer();
    const event = '{"kind":"turn.completed","turnId":"t_x"}';
    for (let i = 0; i < event.length; i += 1) {
      const r = b.push(bytes(event[i]!));
      expect(r).toEqual([]);
    }
    // Now the newline.
    expect(b.push(bytes('\n'))).toEqual([event]);
  });

  it('repeated push/flush cycles are independent', () => {
    const b = new JsonlLineBuffer();
    expect(b.push(bytes('{"a":1}\n'))).toEqual(['{"a":1}']);
    expect(b.flush()).toEqual([]);
    expect(b.push(bytes('{"b":2}'))).toEqual([]);
    expect(b.flush()).toEqual(['{"b":2}']);
    // Buffer cleared between flushes.
    expect(b.flush()).toEqual([]);
  });
});

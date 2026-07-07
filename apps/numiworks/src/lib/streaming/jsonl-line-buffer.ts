/**
 * Buffered JSONL line decoder for client-side stream readers.
 *
 * Owns:
 *   - The TextDecoder (so multi-byte UTF-8 sequences split across chunk
 *     boundaries don't drop bytes).
 *   - The "pending partial line" buffer (so the second half of a line
 *     arriving in a later chunk gets stitched back together).
 *
 * Two methods:
 *   - `push(chunk)` - feed a chunk; returns any complete lines that
 *     can be parsed now. The trailing partial (if any) stays buffered.
 *   - `flush()` - call once when the upstream signals `done`. Returns
 *     any final lines, including a trailing line that lacked a `\n`,
 *     plus drains the decoder of any incomplete multi-byte tail.
 *
 * Without `flush()`, a stream ending mid-codepoint or without a final
 * `\n` silently drops its last event - historically the source of the
 * "stream cut off" symptom we surfaced as "Stream interrupted." The
 * server always writes `\n` after each event, but defending against
 * the case at the reader keeps us safe across runtimes + proxies.
 *
 * Empty lines are filtered out - newline-only frames are not events.
 */
export class JsonlLineBuffer {
  private buf = '';
  private readonly decoder = new TextDecoder();

  push(chunk: Uint8Array): string[] {
    this.buf += this.decoder.decode(chunk, { stream: true });
    const lines = this.buf.split('\n');
    this.buf = lines.pop() ?? '';
    return lines.filter((l) => l.trim().length > 0);
  }

  flush(): string[] {
    const tail = this.buf + this.decoder.decode();
    this.buf = '';
    return tail.split('\n').filter((l) => l.trim().length > 0);
  }
}

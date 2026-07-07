/**
 * Convert an AsyncIterable into a JSONL ReadableStream<Uint8Array>. Each
 * yielded value is JSON.stringify'd, terminated by '\n', UTF-8 encoded,
 * and enqueued. Errors thrown by the iterator close the stream with
 * controller.error() so consumers see the failure.
 *
 * Stream-level logging is intentionally chatty on errors and quiet on
 * success - operators investigating "stream interrupted" symptoms get
 * a clear line in the dev server logs without per-event noise.
 */
export function toJsonlStream<T>(iter: AsyncIterable<T>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let count = 0;
      try {
        for await (const value of iter) {
          controller.enqueue(encoder.encode(JSON.stringify(value) + '\n'));
          count += 1;
        }
        controller.close();
      } catch (err) {
        console.warn('[jsonl-stream] stream errored after', count, 'events:', err);
        controller.error(err);
      }
    },
  });
}

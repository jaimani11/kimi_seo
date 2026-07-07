/**
 * Typed AsyncIterable-backed queue. The graph's nodes call `emit()` as
 * they produce events; the orchestrator runner exposes `iterate()` to
 * consumers (the route handler streams from it).
 *
 * Backed by a buffer + a list of pending waiters. When emit() is called
 * with no waiters, the value queues. When iterate().next() is called
 * with no buffered value, the consumer parks until the next emit() or
 * close(). Closing with an error reroutes the error to the consumer's
 * next iteration, faithful to AsyncIterator semantics.
 */
export interface EventQueue<T> {
  emit(value: T): void;
  close(err?: unknown): void;
  iterate(): AsyncIterable<T>;
}

interface Waiter<T> {
  resolve: (r: IteratorResult<T>) => void;
  reject: (e: unknown) => void;
}

export function createEventQueue<T>(): EventQueue<T> {
  const buffer: T[] = [];
  const waiters: Waiter<T>[] = [];
  let closed = false;
  let closeError: unknown = null;

  function drainWaitersOnClose(): void {
    for (const w of waiters) {
      if (closeError) w.reject(closeError);
      else w.resolve({ value: undefined as never, done: true });
    }
    waiters.length = 0;
  }

  return {
    emit(value) {
      if (closed) return;
      const w = waiters.shift();
      if (w) {
        w.resolve({ value, done: false });
      } else {
        buffer.push(value);
      }
    },
    close(err) {
      if (closed) return;
      closed = true;
      closeError = err ?? null;
      drainWaitersOnClose();
    },
    iterate() {
      return {
        [Symbol.asyncIterator](): AsyncIterator<T> {
          return {
            next(): Promise<IteratorResult<T>> {
              if (buffer.length > 0) {
                const value = buffer.shift() as T;
                return Promise.resolve({ value, done: false });
              }
              if (closed) {
                if (closeError) return Promise.reject(closeError);
                return Promise.resolve({ value: undefined as never, done: true });
              }
              return new Promise<IteratorResult<T>>((resolve, reject) => {
                waiters.push({ resolve, reject });
              });
            },
            return(): Promise<IteratorResult<T>> {
              // Consumer broke out of for-await. Mark closed so any
              // subsequent emits become no-ops; in-flight buffer drops.
              closed = true;
              buffer.length = 0;
              drainWaitersOnClose();
              return Promise.resolve({ value: undefined as never, done: true });
            },
          };
        },
      };
    },
  };
}

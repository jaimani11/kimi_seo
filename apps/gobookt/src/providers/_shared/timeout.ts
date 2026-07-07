import { ProviderTimeoutError } from './errors';

/**
 * Race a promise against a timeout. Used by the orchestrator to bound
 * provider.search() calls. Throws ProviderTimeoutError on timeout so the
 * orchestrator's failure-class handler can mark recoverable.
 */
export async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new ProviderTimeoutError(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

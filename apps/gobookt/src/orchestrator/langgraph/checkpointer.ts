import { MemorySaver, type BaseCheckpointSaver } from '@langchain/langgraph';
import { getServerFeatures } from '@lib/env';

/**
 * Checkpointer factory.
 *
 *  - `MemorySaver` (LangGraph built-in) - default. Process-local.
 *    Survives across turns within the same Node process (refine flow
 *    needs this), lost on restart.
 *
 *  - `PostgresSaver` - when DATABASE_URL is set + the langgraph engine
 *    is selected. Backed by the same Postgres instance Prisma talks to.
 *    Tables live in the `langgraph` schema (separate from Prisma's
 *    `public`) so migrations don't conflict. Caller awaits `.setup()`
 *    once on first construction; we run that lazily inside getCheckpointer.
 *
 * The factory is a singleton - once constructed, the same instance is
 * reused for the process lifetime. Tests bypass the factory and pass
 * `MemorySaver` directly.
 */

let _instance: BaseCheckpointSaver | null = null;
let _setupPromise: Promise<void> | null = null;

export async function getCheckpointer(): Promise<BaseCheckpointSaver> {
  if (_instance) {
    if (_setupPromise) await _setupPromise;
    return _instance;
  }

  if (!getServerFeatures().database) {
    _instance = new MemorySaver();
    return _instance;
  }

  // Lazy-load the Postgres saver only when needed - keeps the keyless
  // build path off any pg-related code.
  const { PostgresSaver } = await import('@langchain/langgraph-checkpoint-postgres');
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    // Defensive - getServerFeatures already gated on this, but a race
    // between env updates and getCheckpointer call is conceivable in tests.
    _instance = new MemorySaver();
    return _instance;
  }
  const saver = PostgresSaver.fromConnString(conn, { schema: 'langgraph' });
  _setupPromise = saver.setup().catch((err: unknown) => {
    console.warn('[langgraph] PostgresSaver.setup() failed, falling back to MemorySaver:', err);
    _instance = new MemorySaver();
  });
  await _setupPromise;
  // If setup fell back, _instance was already replaced above.
  if (!_instance) _instance = saver;
  return _instance;
}

/** Test/diagnostic - drop the cached instance. */
export function _resetCheckpointerForTesting(): void {
  _instance = null;
  _setupPromise = null;
}

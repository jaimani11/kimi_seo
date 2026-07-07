import {
  createOrchestratorEngine,
  getOrchestratorEngineKind,
  type OrchestratorEngine,
} from './engine';

/**
 * Process-level singleton so refine-flow state persists across requests
 * within the same Node process. Lazily constructs on first use.
 *
 * Async because the LangGraph engine awaits PostgresSaver.setup() when
 * DATABASE_URL is present. The hand-rolled engine resolves immediately,
 * so the cost is one microtask in the no-key path.
 *
 * The engine kind is captured at construction time. Flipping
 * STAYSCOUT_ORCHESTRATOR mid-process requires a server restart - by
 * design; we don't want a hot-swap mid-conversation.
 *
 * `globalThis`-anchored - see comment in src/lib/session/factory.ts.
 */
type OrchKind = ReturnType<typeof getOrchestratorEngineKind>;
declare global {
  var __stayscoutOrchestrator:
    | {
        instance: OrchestratorEngine | null;
        construction: Promise<OrchestratorEngine> | null;
        kindAtConstruction: OrchKind | null;
      }
    | undefined;
}

function slot() {
  if (!globalThis.__stayscoutOrchestrator) {
    globalThis.__stayscoutOrchestrator = {
      instance: null,
      construction: null,
      kindAtConstruction: null,
    };
  }
  return globalThis.__stayscoutOrchestrator;
}

export async function getOrchestrator(): Promise<OrchestratorEngine> {
  const s = slot();
  if (s.instance) return s.instance;
  if (s.construction) return s.construction;
  s.kindAtConstruction = getOrchestratorEngineKind();
  s.construction = createOrchestratorEngine().then((e) => {
    s.instance = e;
    return e;
  });
  return s.construction;
}

/** Diagnostic: what engine is currently mounted? */
export function getOrchestratorKind(): OrchKind | null {
  return slot().kindAtConstruction;
}

// Test-only: replace the instance with one constructed by the test.
export function _setOrchestratorForTesting(instance: OrchestratorEngine | null): void {
  const s = slot();
  s.instance = instance;
  s.construction = null;
  s.kindAtConstruction = null;
}

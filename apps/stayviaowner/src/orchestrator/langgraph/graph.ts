import { END, START, StateGraph, type BaseCheckpointSaver } from '@langchain/langgraph';
import { GraphAnnotation } from './state';
import {
  makeBootstrapNode,
  makeIntentNode,
  makeOpportunityNode,
  makeSearchNode,
  makeComposeNode,
  makeMoodNode,
  makeMemoryHintNode,
  makeCompleteNode,
  routeAfterBootstrap,
  routeAfterIntent,
  routeAfterSearch,
  type GraphDeps,
} from './nodes';

/**
 * Build + compile the StateGraph. Called once per Orchestrator instance
 * - the compiled graph is reused across `run()` invocations. A
 * checkpointer is wired when supplied (Postgres in prod; MemorySaver in
 * mock-mode dev).
 *
 * Edges:
 *   START → bootstrap
 *   bootstrap → intent | END (hard fail/duplicate)
 *   intent → search | run_opportunity | END (hard fail)         [F1]
 *   search → compose | complete (soft empty) | END (hard fail)
 *   compose → mood
 *   mood → memory_hint
 *   memory_hint → complete
 *   run_opportunity → complete                                   [F1]
 *   complete → END
 */
export function buildGraph(deps: GraphDeps, checkpointer?: BaseCheckpointSaver) {
  // Node names are prefixed with verbs (`extract_*`, `run_*`, ...) so
  // they never collide with state channel names (LangGraph rejects that).
  const g = new StateGraph(GraphAnnotation)
    .addNode('bootstrap_turn', makeBootstrapNode(deps))
    .addNode('extract_intent', makeIntentNode(deps))
    .addNode('run_search', makeSearchNode(deps))
    .addNode('run_opportunity', makeOpportunityNode(deps))
    .addNode('compose_proposal', makeComposeNode(deps))
    .addNode('run_mood', makeMoodNode(deps))
    .addNode('evaluate_hint', makeMemoryHintNode(deps))
    .addNode('complete_turn', makeCompleteNode(deps))
    .addEdge(START, 'bootstrap_turn')
    .addConditionalEdges('bootstrap_turn', routeAfterBootstrap, {
      next: 'extract_intent',
      end: END,
    })
    .addConditionalEdges('extract_intent', routeAfterIntent, {
      search: 'run_search',
      opportunity: 'run_opportunity',
      end: END,
    })
    .addConditionalEdges('run_search', routeAfterSearch, {
      compose: 'compose_proposal',
      complete: 'complete_turn',
      end: END,
    })
    .addEdge('compose_proposal', 'run_mood')
    .addEdge('run_mood', 'evaluate_hint')
    .addEdge('evaluate_hint', 'complete_turn')
    .addEdge('run_opportunity', 'complete_turn')
    .addEdge('complete_turn', END);

  return checkpointer ? g.compile({ checkpointer }) : g.compile();
}

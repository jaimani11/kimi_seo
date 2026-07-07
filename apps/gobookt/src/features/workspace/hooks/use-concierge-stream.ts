'use client';

import { useCallback, useRef } from 'react';
import { OrchestratorEventSchema } from '@core/orchestrator-event';
import type { ProposalRef } from '@core/partial';
import { JsonlLineBuffer } from '@lib/streaming';
import { useWorkspaceStore } from '../store/workspace-store';

export interface SendArgs {
  rawInput: string;
  type?: 'compose' | 'refine';
  priorProposalRef?: ProposalRef;
}

export interface UseConciergeStream {
  send: (args: SendArgs) => Promise<void>;
  cancel: () => void;
}

export function useConciergeStream(): UseConciergeStream {
  const dispatch = useWorkspaceStore((s) => s.dispatch);
  const beginTurn = useWorkspaceStore((s) => s.beginTurn);
  const sessionId = useWorkspaceStore((s) => s.sessionId);
  const ctrlRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async ({ rawInput, type = 'compose', priorProposalRef }: SendArgs): Promise<void> => {
      ctrlRef.current?.abort();
      const turnId = `t_${crypto.randomUUID()}`;
      const finalSessionId = sessionId ?? `anon_${crypto.randomUUID()}`;

      beginTurn({ turnId, sessionId: finalSessionId, userMessage: rawInput, type });

      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      try {
        const resp = await fetch('/api/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: finalSessionId,
            turnId,
            type,
            input: {
              rawInput,
              ...(priorProposalRef ? { priorProposalRef } : {}),
            },
            clientCapabilities: {
              supportsAdaptationDelta: true,
              supportsMoodSnapshot: true,
              supportsMemoryHint: true,
            },
          }),
          signal: ctrl.signal,
        });

        if (!resp.ok || !resp.body) {
          // Pull whatever the server gave us - even a one-line text body
          // is more informative than "HTTP 500" alone.
          let detail = `HTTP ${resp.status}`;
          try {
            const text = await resp.text();
            const trimmed = text.trim();
            if (trimmed.length > 0 && trimmed.length < 240) {
              detail = `${detail}: ${trimmed}`;
            }
          } catch {
            // Body unreadable - keep the status-only detail.
          }
          dispatch({
            kind: 'turn.failed',
            turnId,
            error: detail,
            recoverable: false,
          });
          return;
        }

        const reader = resp.body.getReader();
        const buffer = new JsonlLineBuffer();

        const dispatchLine = (line: string): void => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(line);
          } catch (parseErr) {
            console.warn(
              '[useConciergeStream] dropped malformed JSON line',
              parseErr instanceof Error ? parseErr.message : parseErr,
              line.length > 200 ? `${line.slice(0, 200)}…` : line,
            );
            return;
          }
          const result = OrchestratorEventSchema.safeParse(parsed);
          if (result.success) {
            dispatch(result.data);
          } else {
            console.warn(
              '[useConciergeStream] dropped invalid event',
              result.error.issues.slice(0, 3),
              parsed,
            );
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // Drain the buffer + decoder. Without this, a stream ending
            // mid-codepoint or without a final '\n' silently drops its
            // last event - historically the source of "Stream interrupted"
            // symptoms when the underlying turn had actually completed.
            for (const line of buffer.flush()) dispatchLine(line);
            break;
          }
          for (const line of buffer.push(value)) dispatchLine(line);
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        dispatch({
          kind: 'turn.failed',
          turnId,
          error: err instanceof Error ? err.message : String(err),
          recoverable: false,
        });
      }
    },
    [dispatch, beginTurn, sessionId],
  );

  const cancel = useCallback((): void => {
    ctrlRef.current?.abort();
  }, []);

  return { send, cancel };
}

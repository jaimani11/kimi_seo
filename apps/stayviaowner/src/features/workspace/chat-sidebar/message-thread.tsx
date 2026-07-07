'use client';

import { useWorkspaceStore } from '../store/workspace-store';
import { UserMessage } from './user-message';
import { AgentStepList } from './agent-step-list';
import { ConciergeMessage } from './concierge-message';

export function MessageThread() {
  const turns = useWorkspaceStore((s) => s.turns);
  if (turns.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 px-5 pt-2 pb-3">
      {turns.map((t, idx) => (
        <div
          key={t.turnId}
          className="flex flex-col gap-2"
          style={{ opacity: idx === turns.length - 1 ? 1 : 0.7 }}
        >
          <UserMessage text={t.userMessage} />
          <AgentStepList steps={t.steps} />
          <ConciergeMessage turn={t} />
          {t.status === 'failed' && t.error ? (
            <div
              className="rounded-lg border px-3 py-1.5"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--surface-overlay)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--ink-tertiary)',
                fontStyle: 'italic',
              }}
            >
              Stream interrupted. Try again?
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

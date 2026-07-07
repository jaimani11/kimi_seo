'use client';

import { useState } from 'react';
import { Send, Sparkle } from '@/features/shared/icons';
import { useWorkspaceStore } from '../store/workspace-store';
import { useConciergeStream } from '../hooks/use-concierge-stream';
import { selectCurrentTurn } from '../store/derived';

export function InputBar() {
  const draft = useWorkspaceStore((s) => s.inputDraft);
  const setDraft = useWorkspaceStore((s) => s.setInputDraft);
  const phase = useWorkspaceStore((s) => s.phase);
  const currentTurn = useWorkspaceStore((s) => selectCurrentTurn(s));
  const { send } = useConciergeStream();
  const [focused, setFocused] = useState(false);

  const isStreaming = phase === 'composing' || phase === 'shimmering' || phase === 'refining';

  const submit = (): void => {
    if (!draft.trim() || isStreaming) return;
    const isRefine = !!currentTurn?.proposalRef && currentTurn.status === 'settled';
    if (isRefine && currentTurn.proposalRef) {
      void send({ rawInput: draft, type: 'refine', priorProposalRef: currentTurn.proposalRef });
    } else {
      void send({ rawInput: draft, type: 'compose' });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="px-4 py-3"
    >
      <div
        className="flex items-center gap-2 rounded-full border px-3 py-2 backdrop-blur-[10px]"
        style={{
          background: 'var(--surface-overlay)',
          borderColor: focused ? 'var(--accent-primary-glow)' : 'var(--border-emphasis)',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <Sparkle size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Composing your trip…' : 'Tell me about your trip…'}
          className="flex-1 bg-transparent outline-none disabled:opacity-60"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--ink-primary)',
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || isStreaming}
          aria-label="Send"
          className="grid h-7 w-7 place-items-center rounded-full transition-opacity duration-[var(--dur-fast)] disabled:opacity-40"
          style={{
            background: 'var(--accent-primary)',
            color: '#14171C',
          }}
        >
          <Send size={13} strokeWidth={2.2} />
        </button>
      </div>
    </form>
  );
}

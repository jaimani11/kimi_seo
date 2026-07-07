'use client';

import { useWorkspaceStore } from '../store/workspace-store';
import { Greeting } from './greeting';
import { MessageThread } from './message-thread';
import { InputBar } from './input-bar';
import { MemoryHintTile } from './memory-hint-tile';

export function ChatSidebar() {
  const turns = useWorkspaceStore((s) => s.turns);
  const isEmpty = turns.length === 0;

  return (
    <aside
      className="flex h-full flex-col overflow-hidden border-r"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <MemoryHintTile />
      <div className="flex-1 overflow-y-auto">{isEmpty ? <Greeting /> : <MessageThread />}</div>
      <InputBar />
    </aside>
  );
}

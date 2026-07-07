import { z } from 'zod';

// Slice A1-A2 ship only the seam (interface-only). Real Memory Agent /
// pgvector lands in Slice C. The shapes here match what the Slice C
// MemoryAgent will produce so consumers can program against them today.

export interface MemoryContext {
  recall: (key: string) => Promise<readonly MemoryRecord[]>;
  write: (record: Omit<MemoryRecord, 'id' | 'createdAt'>) => Promise<void>;
}

export const MemoryRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: z.enum(['episodic', 'structural']),
  content: z.string(),
  signalKey: z.string().optional(),
  weight: z.number().optional(),
  embedding: z.array(z.number()).optional(), // pgvector float[]
  createdAt: z.string(),
});
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;

export const MemoryHintSchema = z.object({
  message: z.string(), // "You seem to prefer slower, walkable destinations."
  signalKey: z.string(), // 'pace' | 'walkability' | 'cuisine'
  confidence: z.number().min(0).max(1),
});
export type MemoryHint = z.infer<typeof MemoryHintSchema>;

// EscalationPath - interface-only stub for Slice C+ human concierge handoff
export const EscalationPathSchema = z.object({
  kind: z.literal('concierge-handoff'),
  reason: z.string(),
  tier: z.enum(['standard', 'vip', 'enterprise']),
});
export type EscalationPath = z.infer<typeof EscalationPathSchema>;

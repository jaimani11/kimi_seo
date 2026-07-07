import { z } from 'zod';

export const AdaptationNoteSchema = z.object({
  description: z.string(), // "Reduced nightlife weighting"
  signal: z.string(), // "vibrancy"
  direction: z.enum(['up', 'down', 'add', 'remove']),
  weight: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type AdaptationNote = z.infer<typeof AdaptationNoteSchema>;

export const MoodSnapshotSchema = z.object({
  destinationName: z.string(),
  text: z.string(),
  source: z.enum(['curated', 'llm']),
  confidence: z.number().min(0).max(1).optional(),
});
export type MoodSnapshot = z.infer<typeof MoodSnapshotSchema>;

// ExplanationTopic for the agent.explanation seam (Slice B+ uses)
export const ExplanationTopicSchema = z.enum([
  'inference-summary',
  'ranking-decision',
  'change-rationale',
  'deprioritization',
  'tradeoff',
]);
export type ExplanationTopic = z.infer<typeof ExplanationTopicSchema>;

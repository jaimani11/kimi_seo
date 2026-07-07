import { lintVoice } from '@lib/curation/voice';

export interface TasteLintIssue {
  path: string; // file or schema path where the violation occurred
  field: string; // 'description' | 'mood.text' | etc.
  word: string;
  sample: string;
}

/**
 * Run the banned-word lint over a single field's value. Returns structured
 * issues so the CI seed test can surface them legibly.
 */
export function lintField(path: string, field: string, value: string): TasteLintIssue[] {
  const result = lintVoice(value);
  return result.matches.map((m) => ({
    path,
    field,
    word: m.word,
    sample: value.slice(Math.max(0, m.index - 20), m.index + m.word.length + 20),
  }));
}

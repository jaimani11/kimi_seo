// Voice rules - codified taste constraints from spec §5.17 + §8.13.
// Used by:
//   * tests/seed.test.ts (fails CI if curated copy violates)
//   * MoodSnapshotAgent (Slice A6) to validate LLM output before emitting
//   * Slice B+ taste-governance pipeline

// Banned cliché list. Restrained over expansive - we add words when we
// catch them in real outputs, not preemptively.
export const BANNED_WORDS: readonly string[] = [
  'unforgettable',
  'experience',
  'hidden gem',
  'discover',
  'journey',
  'magical',
  'unique',
  'breathtaking',
  'must-see',
  'bucket-list',
  'enchanting',
  'paradise',
  'oasis',
  'gem',
  'best-kept secret',
];

const BANNED_REGEX = new RegExp(
  `\\b(${BANNED_WORDS.map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b`,
  'i',
);

export interface VoiceLintResult {
  ok: boolean;
  matches: { word: string; index: number }[];
}

export function lintVoice(text: string): VoiceLintResult {
  const matches: VoiceLintResult['matches'] = [];
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ word, index: m.index });
    }
  }
  return { ok: matches.length === 0, matches };
}

export const containsBannedWord = (text: string): boolean => BANNED_REGEX.test(text);

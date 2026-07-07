import { citiesWithScores, type DestinationScores } from '@lib/seo/destination-scores';
import { findCityBySlug, type SeoCity } from '@lib/seo/cities';
import { QUIZ_QUESTIONS, type ScoreWeights } from './questions';

/**
 * Score every city with a DestinationScores entry against the
 * user's answers and return the top N matches. Deterministic —
 * same answers always produce the same result — so shareable
 * result URLs behave identically for anyone who visits them.
 *
 * Algorithm: sum the per-question option weights into a single
 * `ScoreWeights` bag. For each city, multiply the city's score on
 * each dimension by the corresponding weight and sum. Higher total
 * = better match.
 */

export interface QuizPick {
  city: SeoCity;
  scores: DestinationScores;
  matchScore: number;
  /** Which dimensions drove the match — the top 3 highest-contribution
   *  dimensions for this specific pick + this user's weights. */
  topDimensions: readonly (keyof DestinationScores)[];
}

/**
 * @param answers 1 answer per question — indices into
 *                QUIZ_QUESTIONS[i].options. Missing answers ignored
 *                (so partial quizzes still produce results).
 * @param limit   How many picks to return (default 3).
 */
export function scoreQuiz(answers: readonly number[], limit = 3): QuizPick[] {
  const weights = accumulateWeights(answers);
  const dimensions = Object.keys(weights) as (keyof DestinationScores)[];

  const picks: QuizPick[] = [];
  for (const { slug, scores } of citiesWithScores()) {
    const city = findCityBySlug(slug);
    if (!city) continue;
    let total = 0;
    const perDim: { key: keyof DestinationScores; contribution: number }[] = [];
    for (const dim of dimensions) {
      const w = weights[dim] ?? 0;
      if (w === 0) continue;
      const contribution = w * scores[dim];
      total += contribution;
      perDim.push({ key: dim, contribution });
    }
    perDim.sort((a, b) => b.contribution - a.contribution);
    const topDimensions = perDim.slice(0, 3).map((d) => d.key);
    picks.push({ city, scores, matchScore: total, topDimensions });
  }

  picks.sort((a, b) => b.matchScore - a.matchScore);
  return picks.slice(0, limit);
}

function accumulateWeights(answers: readonly number[]): ScoreWeights {
  const w: ScoreWeights = {};
  for (let i = 0; i < QUIZ_QUESTIONS.length; i += 1) {
    const questionAnswer = answers[i];
    if (questionAnswer === undefined || questionAnswer < 0) continue;
    const option = QUIZ_QUESTIONS[i]!.options[questionAnswer];
    if (!option) continue;
    for (const [dim, val] of Object.entries(option.weights)) {
      const key = dim as keyof DestinationScores;
      w[key] = (w[key] ?? 0) + val;
    }
  }
  return w;
}

/** Encode answers to a compact URL param — "1,3,0,2,1,2,0,0". */
export function encodeAnswers(answers: readonly number[]): string {
  return answers.join(',');
}

/** Decode "1,3,0,2,1,2,0,0" back to number[]. Silently skips bad indices. */
export function decodeAnswers(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => {
      const n = Number.parseInt(s, 10);
      return Number.isFinite(n) ? n : -1;
    });
}

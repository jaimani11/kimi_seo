import type { DestinationScores } from '@lib/seo/destination-scores';

/**
 * "Where should I go?" quiz — 8 questions × 3-4 options each. Each
 * option carries a `weights` map that boosts (or dampens) certain
 * DestinationScore dimensions when computing city match scores.
 *
 * Design: no single question determines the result. Each answer
 * nudges the ranking; the sum across 8 answers produces a robust
 * top-3 recommendation.
 *
 * To tune the quiz: change weight magnitudes below; higher numbers
 * mean stronger preference. Negative weights push away from a
 * dimension (e.g., "chill and quiet" dampens nightlife).
 */

export type ScoreWeights = Partial<Record<keyof DestinationScores, number>>;

export interface QuizOption {
  label: string;
  emoji: string;
  weights: ScoreWeights;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: readonly QuizOption[];
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'company',
    question: 'Who\'s on this trip?',
    options: [
      { label: 'Solo — just me', emoji: '🧳', weights: { walkability: 1, food: 1, digitalNomad: 1 } },
      { label: 'Partner — the two of us', emoji: '💛', weights: { romance: 3, food: 1, luxury: 1 } },
      { label: 'Family with kids', emoji: '👨‍👩‍👧', weights: { family: 3, walkability: 1 } },
      { label: 'Group of friends', emoji: '🎉', weights: { nightlife: 2, food: 1 } },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s the daily budget per person?',
    options: [
      { label: 'Backpack — under $75/day', emoji: '💵', weights: { budget: 3, luxury: -2 } },
      { label: 'Comfortable — $75–200/day', emoji: '💵💵', weights: { budget: 1 } },
      { label: 'Elevated — $200–500/day', emoji: '💎', weights: { luxury: 2, budget: -1 } },
      { label: 'Sky\'s the limit — $500+/day', emoji: '👑', weights: { luxury: 3, budget: -2 } },
    ],
  },
  {
    id: 'vibe',
    question: 'What\'s the ideal vibe?',
    options: [
      { label: 'Big city energy', emoji: '🌆', weights: { nightlife: 2, food: 2, walkability: 1 } },
      { label: 'Beach and chill', emoji: '🏖️', weights: { romance: 1, nightlife: -1 } },
      { label: 'Nature and mountains', emoji: '🏔️', weights: { romance: 1, family: 1 } },
      { label: 'Ancient history + culture', emoji: '🏛️', weights: { walkability: 1, food: 1 } },
    ],
  },
  {
    id: 'food',
    question: 'How central is food to the trip?',
    options: [
      { label: 'It\'s the whole trip', emoji: '🍜', weights: { food: 3 } },
      { label: 'Important but not everything', emoji: '🍽️', weights: { food: 1 } },
      { label: 'A meal is a meal', emoji: '🥪', weights: {} },
    ],
  },
  {
    id: 'nights',
    question: 'What\'s the ideal night out?',
    options: [
      { label: 'Late-night bar crawl', emoji: '🌃', weights: { nightlife: 3 } },
      { label: 'Long dinner + wine', emoji: '🍷', weights: { romance: 2, food: 2 } },
      { label: 'A concert or live music', emoji: '🎵', weights: { nightlife: 2, food: 1 } },
      { label: 'Early bed, up for sunrise', emoji: '🌅', weights: { family: 1, nightlife: -2 } },
    ],
  },
  {
    id: 'pace',
    question: 'Preferred pace?',
    options: [
      { label: 'Full days, packed itinerary', emoji: '⚡', weights: { walkability: 1, food: 1 } },
      { label: 'Balanced — mix of active + rest', emoji: '☯️', weights: {} },
      { label: 'Slow — coffee, wander, repeat', emoji: '☕', weights: { walkability: 2, digitalNomad: 1 } },
    ],
  },
  {
    id: 'walkability',
    question: 'How walkable does it need to feel?',
    options: [
      { label: 'Very — I want to leave the car at the airport', emoji: '🚶', weights: { walkability: 3 } },
      { label: 'Doesn\'t matter — I\'ll rent a car', emoji: '🚗', weights: {} },
    ],
  },
  {
    id: 'longstay',
    question: 'Any chance you\'d extend this trip and work from there?',
    options: [
      { label: 'Yes — great wifi + café scene matters', emoji: '💻', weights: { digitalNomad: 3 } },
      { label: 'No — pure vacation', emoji: '🏝️', weights: {} },
    ],
  },
];

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length;

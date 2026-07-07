import type { Metadata } from 'next';
import { canonicalUrl } from '@lib/site/origin';
import { QuizFlow } from '@/features/quiz/quiz-flow';

/**
 * /quiz — the AI "Where should I go?" destination quiz.
 *
 * 8 questions across group / budget / vibe / food / nights / pace /
 * walkability / long-stay potential. Scores every city with a
 * DestinationScores entry and surfaces the top 3 matches. Results
 * are shareable via `?a=1,0,2,...`.
 */

const TITLE = 'Where should I go on my next trip? · numiworks';
const DESCRIPTION =
  'An 8-question travel quiz that scores 90+ destinations against your style and returns your top 3 matches — with bookable tours and stays for each.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl('/quiz') },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl('/quiz'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

interface PageProps {
  searchParams: Promise<{ a?: string }>;
}

export default async function QuizPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialAnswers = params.a ?? null;
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--surface-base)',
      }}
    >
      <QuizFlow initialAnswers={initialAnswers} />
    </main>
  );
}

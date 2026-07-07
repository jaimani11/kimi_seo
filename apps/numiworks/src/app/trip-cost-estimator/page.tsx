import type { Metadata } from 'next';
import { canonicalUrl } from '@lib/site/origin';
import { TripCostForm } from '@/features/trip-cost/trip-cost-form';

const TITLE = 'Trip Cost Estimator + Budget Optimizer · numiworks';
const DESCRIPTION =
  'Interactive trip cost calculator for 90+ destinations. Enter your dates, group size, and comfort level and get flights, hotels, food, and activities line by line — with budget-fit suggestions when you cap it.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl('/trip-cost-estimator') },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl('/trip-cost-estimator'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function TripCostEstimatorPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <TripCostForm />
    </main>
  );
}

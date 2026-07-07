import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Flights · stayviaowner',
  description:
    'Search flights across every major carrier. One-way, round-trip, multi-city. Expedia Flights — the price you pay is the same.',
};

export default function FlightsPage() {
  return (
    <CategoryLanding
      category="flights"
      heading="Flights — every major carrier."
      subhead="Expedia Flights compares fares across hundreds of airlines so you can grab the right route in the right cabin."
    />
  );
}

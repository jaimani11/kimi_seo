import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Flights · gotript',
  description:
    'Search flights across every major carrier. One-way, round-trip, multi-city. Searches hand off to Expedia Flights.',
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

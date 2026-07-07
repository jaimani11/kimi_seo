import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Things to do · stayviaowner',
  description:
    'Book tours, day trips, food walks, attractions, and skip-the-line tickets through Expedia Attractions.',
};

export default function ThingsToDoPage() {
  return (
    <CategoryLanding
      category="attractions"
      heading="Things to do — tours, day trips, tickets."
      subhead="Bookable experiences via Expedia Attractions. Skip-the-line tickets, guided tours, half-day adventures."
    />
  );
}

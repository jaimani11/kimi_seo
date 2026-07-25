import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Vacation rentals — whole homes, cabins & villas · gotript',
  description:
    'Search VRBO for whole homes, cabins, villas, condos, and apartments worldwide. More space, kitchens, and privacy than a hotel. Powered by VRBO (an Expedia Group brand).',
};

export default function VacationRentalsPage() {
  return (
    <CategoryLanding
      category="vacation-rentals"
      heading="Vacation rentals — whole homes, more space, better trips."
      subhead="VRBO's 2M+ listings across every destination. Kitchens, room to spread out, no shared walls — the trip your group actually wants."
    />
  );
}

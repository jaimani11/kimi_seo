import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Stays & vacation rentals · stayviaowner',
  description:
    'Whole-home vacation rentals — villas, cabins and cottages — plus hotels, apartments and resorts across 175+ destinations, at the same price you would pay booking direct.',
};

export default function StaysPage() {
  return (
    <CategoryLanding
      category="hotels"
      heading="Stays — whole homes, villas & cabins."
      subhead="Book whole-home rentals with full kitchens and room for the group, or compare hotels, apart-hotels and resorts worldwide."
    />
  );
}

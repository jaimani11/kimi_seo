import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Vacation packages — hotel + flight bundles · gotript',
  description:
    "Bundle a hotel and flight in one search. Expedia's package deals routinely beat à-la-carte booking — same hotel, same flight, lower total price. Powered by Expedia Vacation Packages.",
};

export default function PackagesPage() {
  return (
    <CategoryLanding
      category="packages"
      heading="Packages — bundle and save."
      subhead="Expedia's vacation packages bundle a hotel + flight in one search. Same partners, same dates, lower total than booking each separately."
    />
  );
}

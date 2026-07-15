import type { Metadata } from 'next';
import { CruisesLanding } from '@/features/site/cruises-landing';

export const metadata: Metadata = {
  // Retired vertical: stayviaowner is a Vrbo whole-home rental brand, so this
  // off-brand Expedia page is de-linked from nav + kept out of the index.
  robots: { index: false, follow: false },
  title: 'Cruises — Mediterranean, Caribbean, Alaska & more · stayviaowner',
  description:
    'River, ocean, and expedition cruises across every major line — Royal Caribbean, MSC, Carnival, NCL, Princess, Disney, Virgin. Mediterranean, Caribbean, Alaska, Norwegian fjords, Asia. Powered by Expedia Cruises.',
};

export default function CruisesPage() {
  return <CruisesLanding />;
}

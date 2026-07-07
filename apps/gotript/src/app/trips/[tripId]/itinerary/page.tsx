import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerAuth, ownerOf } from '@lib/auth';
import { getSessionStore } from '@lib/session/factory';
import { getItinerarySubsystem } from '@lib/itinerary';
import { requirePremium } from '@lib/billing';
import { ItineraryView } from '@/features/itinerary/itinerary-view';
import { UpgradeCard } from '@/features/billing/upgrade-card';

interface PageProps {
  params: Promise<{ tripId: string }>;
}

/**
 * Owner-gated server-rendered itinerary page.
 *
 * Flow:
 *   1. Resolve owner from auth.
 *   2. Load the SavedTrip by tripId for the current owner. 404 if
 *      missing - same path used for share/save/delete (B1 invariants).
 *   3. Cache lookup. Generate via the subsystem if missing; cache the
 *      result so a refresh is fast.
 *   4. Render ItineraryView.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tripId } = await params;
  const auth = await getServerAuth();
  const owner = ownerOf(auth);
  const store = getSessionStore();
  const trip = await store.getTrip({
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    tripId,
  });
  if (!trip) {
    return { title: 'Itinerary not found · gotript' };
  }
  return {
    title: `${trip.proposalSummary.heroStayName} · Day-by-day · gotript`,
    description: `Three days in ${trip.proposalSummary.destinationName}.`,
  };
}

export default async function ItineraryPage({ params }: PageProps) {
  const { tripId } = await params;

  const auth = await getServerAuth();
  const owner = ownerOf(auth);
  const trip = await getSessionStore().getTrip({
    ownerKind: owner.ownerKind,
    ownerId: owner.ownerId,
    tripId,
  });
  if (!trip) notFound();

  const subsystem = getItinerarySubsystem();
  let itinerary = await subsystem.store.get(tripId);
  if (!itinerary) {
    itinerary = await subsystem.generator.generate(trip);
    await subsystem.store.put(itinerary);
  }

  // Slice C4 soft-gate: synthesized fallback (non-curated destination)
  // requires premium. Curated destinations (the 7 Italian regions) skip
  // the gate entirely - the demo always renders for free.
  if (itinerary.source === 'synthesized') {
    const gate = await requirePremium({
      ownerKind: owner.ownerKind,
      ownerId: owner.ownerId,
    });
    if (!gate.entitled) {
      const returnPath = `/trips/${tripId}/itinerary`;
      return (
        <UpgradeCard
          destinationName={trip.proposalSummary.destinationName}
          reason={gate.reason}
          returnPath={returnPath}
          cancelPath="/"
        />
      );
    }
  }

  return (
    <ItineraryView
      itinerary={itinerary}
      destinationName={trip.proposalSummary.destinationName}
      heroStayName={trip.proposalSummary.heroStayName}
      nights={trip.proposalSummary.nights}
    />
  );
}

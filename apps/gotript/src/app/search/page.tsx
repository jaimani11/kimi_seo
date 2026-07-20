import { permanentRedirect } from 'next/navigation';

/**
 * /search retired on gotript (the Expedia brand). It wrapped Viator freetext
 * search — broken without VIATOR_API_KEY and off-brand here. "Search
 * experiences" belongs to numiworks (the Viator hub). 308 home so the old
 * noindex ?q= URLs and any stray inbound links resolve cleanly; the mega-nav
 * no longer points here either.
 */
export default function SearchPage() {
  permanentRedirect('/');
}

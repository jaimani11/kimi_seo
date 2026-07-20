import { permanentRedirect } from 'next/navigation';

/**
 * /search retired on stayviaowner (the VRBO whole-home brand). It wrapped
 * Viator freetext search — broken without VIATOR_API_KEY and off-brand here.
 * "Search experiences" belongs to numiworks (the Viator hub). 308 home so the
 * old noindex ?q= URLs and any stray inbound links resolve cleanly.
 */
export default function SearchPage() {
  permanentRedirect('/');
}

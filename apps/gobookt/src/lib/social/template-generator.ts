/**
 * Shim — the deterministic social pack generator lives in
 * @adored/marketing as a brand factory; this binds gobookt's copy
 * voice (CTA domain + hashtag + brand-color mentions).
 */
import { GOBOOKT } from '@adored/brand-config';
import { createSocialTemplateGenerator } from '@adored/marketing';

export const buildSocialPackFromTemplate = createSocialTemplateGenerator({
  name: GOBOOKT.name,
  label: GOBOOKT.domain,
  hashtag: GOBOOKT.name,
  // gobookt is a Booking.com stays brand — no Viator / AI-planner CTAs.
  ctaOptions: [
    `Find stays on ${GOBOOKT.domain}`,
    `Plan your trip on ${GOBOOKT.domain}`,
    `Compare hotels on ${GOBOOKT.domain}`,
    `Get the full guide on ${GOBOOKT.domain}`,
    `Book your stay via ${GOBOOKT.domain}`,
  ],
});

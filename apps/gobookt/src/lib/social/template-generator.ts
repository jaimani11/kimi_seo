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
});

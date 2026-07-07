/**
 * Shim — the deterministic social pack generator lives in
 * @adored/marketing as a brand factory; this binds gotript's copy
 * voice (CTA domain + hashtag + brand-color mentions).
 */
import { GOTRIPT } from '@adored/brand-config';
import { createSocialTemplateGenerator } from '@adored/marketing';

export const buildSocialPackFromTemplate = createSocialTemplateGenerator({
  name: GOTRIPT.name,
  label: GOTRIPT.domain,
  hashtag: GOTRIPT.name,
});

/**
 * Shim — the deterministic social pack generator lives in
 * @adored/marketing as a brand factory; this binds stayviaowner's copy
 * voice (CTA domain + hashtag + brand-color mentions).
 */
import { STAYVIAOWNER } from '@adored/brand-config';
import { createSocialTemplateGenerator } from '@adored/marketing';

export const buildSocialPackFromTemplate = createSocialTemplateGenerator({
  name: STAYVIAOWNER.name,
  label: STAYVIAOWNER.domain,
  hashtag: STAYVIAOWNER.name,
});

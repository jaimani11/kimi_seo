/**
 * Shim — the deterministic social pack generator lives in
 * @adored/marketing as a brand factory; this binds numiworks's copy
 * voice (CTA domain + hashtag + brand-color mentions).
 */
import { NUMIWORKS } from '@adored/brand-config';
import { createSocialTemplateGenerator } from '@adored/marketing';

export const buildSocialPackFromTemplate = createSocialTemplateGenerator({
  name: NUMIWORKS.name,
  label: NUMIWORKS.domain,
  hashtag: NUMIWORKS.name,
});

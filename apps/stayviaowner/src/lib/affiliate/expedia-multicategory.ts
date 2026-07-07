/**
 * Shim — the Expedia multi-category builder lives in
 * @adored/affiliate as a brand-parameterized factory. This file
 * binds stayviaowner's label / _src / camref from
 * @adored/brand-config and re-exports the same surface the app has
 * always imported.
 */
import { STAYVIAOWNER } from '@adored/brand-config';
import { createExpediaMulticategory } from '@adored/affiliate';

export type {
  ExpediaCategory,
  ExpediaMultiConfig,
  CategorySearchInput,
} from '@adored/affiliate';
export { CATEGORY_META } from '@adored/affiliate';

const bound = createExpediaMulticategory({
  label: STAYVIAOWNER.affiliate.expediaLabel ?? STAYVIAOWNER.key,
  src: STAYVIAOWNER.key,
  ...(STAYVIAOWNER.affiliate.expediaCamref
    ? { defaultCamref: STAYVIAOWNER.affiliate.expediaCamref }
    : {}),
});

export const getExpediaMultiConfig = bound.getExpediaMultiConfig;
export const buildExpediaCategoryUrl = bound.buildExpediaCategoryUrl;

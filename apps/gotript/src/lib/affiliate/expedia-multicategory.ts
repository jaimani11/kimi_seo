/**
 * Shim — the Expedia multi-category builder lives in
 * @adored/affiliate as a brand-parameterized factory. This file
 * binds gotript's label / _src / camref from @adored/brand-config
 * and re-exports the same surface the app has always imported.
 */
import { GOTRIPT } from '@adored/brand-config';
import { createExpediaMulticategory } from '@adored/affiliate';

export type {
  ExpediaCategory,
  ExpediaMultiConfig,
  CategorySearchInput,
} from '@adored/affiliate';
export { CATEGORY_META } from '@adored/affiliate';

const bound = createExpediaMulticategory({
  label: GOTRIPT.affiliate.expediaLabel ?? GOTRIPT.key,
  src: GOTRIPT.key,
  ...(GOTRIPT.affiliate.expediaCamref
    ? { defaultCamref: GOTRIPT.affiliate.expediaCamref }
    : {}),
});

export const getExpediaMultiConfig = bound.getExpediaMultiConfig;
export const buildExpediaCategoryUrl = bound.buildExpediaCategoryUrl;

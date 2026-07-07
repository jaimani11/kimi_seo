/** Shim — Pinterest v5 REST client lives in @adored/marketing. */
export type {
  PinterestBoard,
  PinterestCreatePinInput,
  PinterestApiError,
  PinterestStatus,
} from '@adored/marketing';
export { PinterestClient, pinterestClientFromEnv, checkPinterestStatus } from '@adored/marketing';

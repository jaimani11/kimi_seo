export type { BrandConfig, BrandAffiliateConfig, BrandColors } from './types';
export {
  NUMIWORKS,
  GOTRIPT,
  GOBOOKT,
  STAYVIAOWNER,
  ALL_BRANDS,
  findBrand,
} from './brands';
export type { CityBookingLink } from './network';
export { cityBookingLinks } from './network';
export { buildSiteJsonLd } from './site-schema';
export {
  destinationCopy,
  applyGuideVoice,
  type DestinationCopy,
  type DestinationCopyBrand,
  type SectionVoiceBrand,
} from './destination-copy';
export {
  applyEditorialVoice,
  type EditorialBrand,
  type EditorialMeta,
} from './editorial-voice';

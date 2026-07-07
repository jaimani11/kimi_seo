/**
 * Public surface of the discovery rail system.
 *
 * Pages import `DiscoveryRail` and hand it a curated section; every
 * layout variant lives inside this directory but isn't named on the
 * outside so we can refactor freely.
 */

export { DiscoveryRail } from './discovery-rail';
export { DiscoverySectionHeader } from './discovery-section-header';
export {
  DiscoveryExperienceRail,
  type ExperienceRailLayout,
  type ExperienceRailSection,
} from './discovery-experience-rail';

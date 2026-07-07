/**
 * @adored/travel-tools — dependency-free travel math + market data
 * helpers shared by every brand.
 *
 *   geo       — haversine distance + walking-time phrasing
 *   sun       — NOAA sunrise/sunset (client- and server-safe)
 *   currency  — ECB USD conversion strip (frankfurter.dev, 24h cache)
 *
 * Nothing here touches brand config or React — keep it that way so
 * scripts (data generators, cron routes) can import it freely.
 */

export type { LatLng } from './geo';
export { haversineKm, walkMinutes, distanceLabel } from './geo';

export type { SunTimes } from './sun';
export { sunTimesForDate, localDateParts, formatInTz } from './sun';

export type { DisplayCurrency, UsdRates } from './currency';
export {
  DISPLAY_CURRENCIES,
  getUsdRates,
  formatConvertedStrip,
} from './currency';

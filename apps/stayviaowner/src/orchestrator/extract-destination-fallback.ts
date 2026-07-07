import { DESTINATION_PHOTOS } from '@lib/imagery/destination-photo-data';

/**
 * Fallback destination extractor for raw input that the IntentAgent
 * couldn't parse into a TripIntent.destinations entry.
 *
 * The IntentAgent occasionally returns an intent with an empty
 * destinations array - the model can't always reliably extract a
 * destination from terse natural language like "Austria ski trip for
 * 6 people" or "anywhere with mountains." When that happens the
 * orchestrator's opportunity branch used to short-circuit with a
 * "tell me where" message; this extractor saves most of those cases
 * by keyword-matching against:
 *
 *   1. The hand-curated city table in `destination-photo-data.ts`
 *      (e.g. "tokyo", "vancouver", "kyoto").
 *   2. A small country-name → ISO-3166 alpha-2 lookup so prompts that
 *      name a country instead of a city ("Austria", "Iceland",
 *      "Japan") still resolve.
 *
 * Returns `{ name, country }` on success; null when no recognizable
 * destination is found, in which case the orchestrator falls back to
 * the gentle "tell me where" path.
 */

// City keys from destination-photo-data.ts that have a known country.
// `destination-photo-data.ts` doesn't track country on each city, so
// we mirror it here. New cities added there should also land here.
const CITY_TO_COUNTRY: Readonly<Record<string, string>> = {
  amsterdam: 'NL',
  austin: 'US',
  bangkok: 'TH',
  barcelona: 'ES',
  berlin: 'DE',
  boston: 'US',
  'buenos-aires': 'AR',
  chicago: 'US',
  copenhagen: 'DK',
  dubai: 'AE',
  edinburgh: 'GB',
  florence: 'IT',
  hanoi: 'VN',
  helsinki: 'FI',
  'hong-kong': 'HK',
  istanbul: 'TR',
  jakarta: 'ID',
  kyoto: 'JP',
  lisbon: 'PT',
  london: 'GB',
  'los-angeles': 'US',
  madrid: 'ES',
  marrakech: 'MA',
  melbourne: 'AU',
  'mexico-city': 'MX',
  miami: 'US',
  milan: 'IT',
  montreal: 'CA',
  mumbai: 'IN',
  'new-york': 'US',
  oslo: 'NO',
  paris: 'FR',
  porto: 'PT',
  prague: 'CZ',
  reykjavik: 'IS',
  rome: 'IT',
  'san-francisco': 'US',
  seoul: 'KR',
  shanghai: 'CN',
  singapore: 'SG',
  sydney: 'AU',
  taipei: 'TW',
  tokyo: 'JP',
  toronto: 'CA',
  vancouver: 'CA',
  venice: 'IT',
  vienna: 'AT',
  amalfi: 'IT',
  banff: 'CA',
  bali: 'ID',
  'cinque-terre': 'IT',
  'costa-rica': 'CR',
  hawaii: 'US',
  iceland: 'IS',
  'lake-como': 'IT',
  maldives: 'MV',
  'new-zealand': 'NZ',
  patagonia: 'AR',
  provence: 'FR',
  puglia: 'IT',
  tuscany: 'IT',
  umbria: 'IT',
  whistler: 'CA',
};

// Country / region names → ISO code. Covers the most common prompts.
const COUNTRY_NAME_TO_CODE: Readonly<Record<string, string>> = {
  austria: 'AT',
  switzerland: 'CH',
  norway: 'NO',
  sweden: 'SE',
  iceland: 'IS',
  italy: 'IT',
  france: 'FR',
  spain: 'ES',
  portugal: 'PT',
  japan: 'JP',
  canada: 'CA',
  usa: 'US',
  'united-states': 'US',
  america: 'US',
  uk: 'GB',
  'united-kingdom': 'GB',
  britain: 'GB',
  england: 'GB',
  scotland: 'GB',
  ireland: 'IE',
  australia: 'AU',
  'new-zealand': 'NZ',
  nz: 'NZ',
  mexico: 'MX',
  argentina: 'AR',
  brazil: 'BR',
  chile: 'CL',
  peru: 'PE',
  germany: 'DE',
  netherlands: 'NL',
  belgium: 'BE',
  greece: 'GR',
  croatia: 'HR',
  turkey: 'TR',
  egypt: 'EG',
  morocco: 'MA',
  'south-africa': 'ZA',
  kenya: 'KE',
  india: 'IN',
  thailand: 'TH',
  vietnam: 'VN',
  indonesia: 'ID',
  malaysia: 'MY',
  singapore: 'SG',
  philippines: 'PH',
  china: 'CN',
  korea: 'KR',
  'south-korea': 'KR',
  taiwan: 'TW',
  maldives: 'MV',
  bali: 'ID',
};

export interface ExtractedDestination {
  name: string;
  country: string;
}

/**
 * Try to recover a destination from raw natural-language input.
 * Returns null when nothing recognizable is found.
 */
export function extractDestinationFallback(rawInput: string): ExtractedDestination | null {
  if (!rawInput || rawInput.trim().length === 0) return null;

  const tokens = tokenize(rawInput);

  // Try 2-word phrases first so "New York", "Hong Kong", "Lake Como",
  // "Costa Rica" beat single-word lookups against their individual
  // tokens. We try the same phrase as both `-` joined (matches the
  // destination-photo-data normalized key) and space-joined (for
  // country-name lookup, e.g. "united states").
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i]!;
    const b = tokens[i + 1]!;
    const hyphen = `${a}-${b}`;
    if (CITY_TO_COUNTRY[hyphen] || DESTINATION_PHOTOS[hyphen]) {
      const country = CITY_TO_COUNTRY[hyphen] ?? 'US';
      return { name: titleCase(`${a} ${b}`), country };
    }
    if (COUNTRY_NAME_TO_CODE[hyphen]) {
      return { name: titleCase(`${a} ${b}`), country: COUNTRY_NAME_TO_CODE[hyphen]! };
    }
  }

  // Single-word lookups.
  for (const token of tokens) {
    if (CITY_TO_COUNTRY[token] || DESTINATION_PHOTOS[token]) {
      const country = CITY_TO_COUNTRY[token] ?? 'US';
      return { name: titleCase(token), country };
    }
    if (COUNTRY_NAME_TO_CODE[token]) {
      return { name: titleCase(token), country: COUNTRY_NAME_TO_CODE[token]! };
    }
  }

  return null;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[\s,.'":;!?()/]+/)
    .filter((t) => t.length > 0);
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => (w.length === 0 ? '' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

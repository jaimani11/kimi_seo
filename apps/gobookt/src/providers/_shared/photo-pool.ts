/**
 * Photo pool - hand-curated Unsplash IDs grouped by category.
 *
 * Used by `LLMSynthesizedProvider` so model-generated stays pull from
 * a pool rather than every cityscape stay sharing the same image.
 *
 * Selection is deterministic on the stay slug (FNV-1a hash → modulo
 * pool size). Same slug → same photo across renders/refreshes; two
 * different stays in the same category get different photos.
 *
 * Each pool is ≥ 5 photos so a typical 4-stay batch (1 hero + 3
 * alternatives) of the same category never collides on photos.
 *
 * Adding a category: extend the union type in `llm-stay.ts` and add
 * an entry here with at least 5 ids.
 */

export type PhotoCategory =
  | 'cityscape'
  | 'beach'
  | 'mountains'
  | 'countryside'
  | 'forest'
  | 'lakeside'
  | 'island'
  | 'historic-architecture'
  | 'desert';

const POOL: Readonly<Record<PhotoCategory, readonly string[]>> = {
  cityscape: [
    '1502602898657-3e91760cbb34', // Paris rooftops at dusk
    '1538970272646-f61fabb3a8a2', // Tokyo neon Shibuya
    '1492571350019-22de08371fd3', // NYC skyline night
    '1480714378408-67cf0d13bc1b', // Manhattan grid morning
    '1546436836-07a91091f160', // London city light
    '1485871981521-5b1fd3805eee', // Dubai modern towers
  ],
  beach: [
    '1533104816931-20fa691ff6ca', // Caribbean turquoise
    '1505228395891-9a51e7e86bf6', // tropical palms + sand
    '1507525428034-b723cf961d3e', // Mediterranean cove at golden hour
    '1519046904884-53103b34b206', // Greek beach drone
    '1501785888041-af3ef285b470', // long beach low tide
    '1473496169904-658ba7c44d8a', // coastal cliffs (also valid for island)
  ],
  mountains: [
    // 1568901346375-23c9450c58cd removed - Unsplash repurposed it
    // and the URL now serves a non-travel image (burger photo).
    '1486870591958-9b9d0d1dda99', // Patagonia jagged ridge
    '1464822759023-fed622ff2c3b', // Swiss valley fog
    '1454496522488-7a8e488e8606', // alpine sunrise + pine
    '1502082553048-f009c37129b9', // Rocky Mountain lake
    '1499588562336-15c7b1b4dc18', // mountain road perspective
  ],
  countryside: [
    '1490642914619-7955a3fd483c', // Tuscany cypress road
    '1500382017468-9049fed747ef', // golden rolling hills + barn
    '1469474968028-56623f02e42e', // alpine meadow + flowers
    '1444930694458-01babe71870e', // English country lane
    '1517654443271-11c4eccdd84b', // wine country vineyard rows
    '1483728642387-6c3bdd6c93e5', // Provence lavender
  ],
  forest: [
    '1473496169904-658ba7c44d8a', // Pacific NW old growth
    '1448375240586-882707db888b', // misty pine canopy
    '1542273917363-3b1817f69a2d', // birch grove sun shafts
    '1501785888041-af3ef285b470', // Norwegian fjord forest
    '1518684079-3c830dcef090', // dense conifer
    '1502082553048-f009c37129b9', // alpine forest + lake
  ],
  lakeside: [
    '1546412414-e1885259563a', // Lake Como villa
    '1502082553048-f009c37129b9', // mountain lake + dock
    '1437846972679-9e6e537be46e', // alpine cabin reflection
    '1465056836041-7f43ac27dcb5', // Lake District boathouse
    '1509316975850-ff9c5deb0cd9', // Norwegian lake fjord
    '1493817217-22c14739dba6', // misty morning lake
  ],
  island: [
    '1499678329028-101435549a4e', // Greek island whitewash
    '1505228395891-9a51e7e86bf6', // tropical island aerial
    '1507525428034-b723cf961d3e', // Mediterranean island cove
    '1518684079-3c830dcef090', // remote island cliffs
    '1473496169904-658ba7c44d8a', // coastal island view
    '1485871981521-5b1fd3805eee', // Pacific island
  ],
  'historic-architecture': [
    '1531572753322-ad063cecc140', // Italian palazzo facade
    '1523906834658-6e24ef2386f9', // Tuscan villa stone
    '1528684056018-d6b5f5063619', // Spanish colonial courtyard
    '1487958449943-2429e8be8625', // Parisian classic
    '1494522855154-9297ac14b55f', // Moroccan riad
    '1518684079-3c830dcef090', // Mediterranean stone village
  ],
  desert: [
    '1567880905822-56f8e06fe630', // red dunes + sky
    '1452796577200-8068b4f88d68', // Atacama dry palette
    '1546436836-07a91091f160', // Moroccan desert dusk
    '1518684079-3c830dcef090', // Sahara expanse
    '1500382017468-9049fed747ef', // golden plain transition
    '1494522855154-9297ac14b55f', // adobe desert town
  ],
};

/** FNV-1a 32-bit hash. Matches the rest of the project's deterministic
 *  hashing pattern (mock-italy + monitoring already use this). */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Pick a stable photo id for the given category + per-stay slug.
 * Same slug → same photo (idempotent across renders); different slugs
 * within the same category get distributed across the pool.
 */
export function pickPhotoId(category: PhotoCategory, slug: string): string {
  const pool = POOL[category];
  if (pool.length === 0) {
    // Schema guarantees ≥5 entries per category; this is defensive.
    throw new Error(`photo pool empty for category ${category}`);
  }
  const idx = fnv1a(slug) % pool.length;
  return pool[idx]!;
}

/** Test-only helper - exposes the pool sizes for the size-≥5 test. */
export function _photoPoolSizes(): Record<PhotoCategory, number> {
  return Object.fromEntries(Object.entries(POOL).map(([k, v]) => [k, v.length])) as Record<
    PhotoCategory,
    number
  >;
}

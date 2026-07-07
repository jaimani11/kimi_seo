import type { DayTheme } from './types';

/**
 * Day-theming for /plan. Maps a (vibe, day-number, total-nights) tuple
 * to a theme so each day pulls a distinct slice of Viator inventory
 * and the days feel sequenced rather than repetitive.
 *
 * Bias rules:
 *   - Day 1 is always `arrival` — light, food-leaning.
 *   - Last day is always `farewell` — slow, walkable.
 *   - 5+ day trips include `day-trip` near the middle.
 *   - 6+ day trips include `sunset-and-water`.
 *   - Vibe tags reweight: `foodie` doubles food days; `adventure`
 *     promotes adventure to day 2; `family` softens adventure to
 *     culture; `romantic` pushes sunset earlier.
 */

export function planDayThemes(
  totalNights: number,
  vibeTags: readonly string[],
): DayTheme[] {
  const days = Math.max(1, Math.min(7, totalNights));
  const tags = new Set(vibeTags.map((t) => t.toLowerCase()));

  // Seed with the structural rules.
  const themes: DayTheme[] = Array.from({ length: days }, () => 'culture-and-history');
  themes[0] = 'arrival';
  if (days >= 2) themes[days - 1] = 'farewell';

  const idx = (i: number) => Math.max(1, Math.min(days - 2, i));

  if (days >= 3) themes[idx(1)] = 'food-and-wine';
  if (days >= 4) themes[idx(2)] = tags.has('family') ? 'culture-and-history' : 'adventure';
  if (days >= 5) themes[idx(3)] = 'day-trip';
  if (days >= 6) themes[idx(4)] = 'sunset-and-water';
  if (days >= 7) themes[idx(5)] = 'free-day';

  // Vibe re-weights (overlay).
  if (tags.has('foodie')) {
    // Promote food earlier.
    if (days >= 4 && themes[idx(2)] !== 'arrival') themes[idx(2)] = 'food-and-wine';
  }
  if (tags.has('adventure') && days >= 3) {
    themes[idx(1)] = 'adventure';
  }
  if (tags.has('romantic') && days >= 4) {
    themes[idx(2)] = 'sunset-and-water';
  }
  if (tags.has('luxury') && days >= 3) {
    // No-op structural; ranks higher-rated picks downstream.
  }

  return themes;
}

export function themeLabel(theme: DayTheme, destination: string): string {
  switch (theme) {
    case 'arrival':
      return `Settling into ${destination}`;
    case 'food-and-wine':
      return `Eating your way through ${destination}`;
    case 'culture-and-history':
      return `${destination} through its stories`;
    case 'adventure':
      return `${destination} at speed`;
    case 'sunset-and-water':
      return `${destination} at golden hour`;
    case 'day-trip':
      return `One day out from ${destination}`;
    case 'free-day':
      return `An unbooked ${destination} day`;
    case 'farewell':
      return `One last slow day`;
  }
}

export function themeQueryHint(theme: DayTheme, destination: string): string {
  switch (theme) {
    case 'arrival':
      return `walking tour ${destination}`;
    case 'food-and-wine':
      return `food tour ${destination}`;
    case 'culture-and-history':
      return `historical tour ${destination}`;
    case 'adventure':
      return `adventure ${destination}`;
    case 'sunset-and-water':
      return `sunset cruise ${destination}`;
    case 'day-trip':
      return `day trip from ${destination}`;
    case 'free-day':
      return `${destination} hidden gems`;
    case 'farewell':
      return `${destination} sunset walk`;
  }
}

export function themeRationale(
  theme: DayTheme,
  position: 'first' | 'middle' | 'last',
  prior?: DayTheme,
): string | undefined {
  if (theme === 'arrival') {
    return 'A light first day. Walk, eat, sleep early.';
  }
  if (theme === 'farewell') {
    return 'Loose ends only. Nothing that requires logistics.';
  }
  if (theme === 'adventure' && prior === 'food-and-wine') {
    return 'Earned by yesterday’s long lunches.';
  }
  if (theme === 'day-trip' && position === 'middle') {
    return 'Mid-trip, when home base feels familiar enough to leave for a day.';
  }
  if (theme === 'sunset-and-water') {
    return 'Slow afternoon, water at golden hour, a small dinner after.';
  }
  return undefined;
}

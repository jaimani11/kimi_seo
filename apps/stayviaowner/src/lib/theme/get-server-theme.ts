import { cookies } from 'next/headers';
import { THEME_COOKIE, type ThemeMode } from './types';

/**
 * Read the theme cookie on the server. Falls back to 'light' (clean,
 * travel-marketplace default, matching RentByOwner/Booking-style sites)
 * if unset. Used in app/layout.tsx to set the data-theme attribute on
 * <html> before any client JS runs - no FOUC. Users can still switch to
 * dark via the toggle; that preference is remembered in the cookie.
 */
export async function getServerTheme(): Promise<ThemeMode> {
  const store = await cookies();
  const cookie = store.get(THEME_COOKIE);
  return cookie?.value === 'dark' ? 'dark' : 'light';
}

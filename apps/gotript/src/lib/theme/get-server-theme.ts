import { cookies } from 'next/headers';
import { THEME_COOKIE, type ThemeMode } from './types';

/**
 * Read the theme cookie on the server. Falls back to 'dark' (cinematic) if
 * unset. Used in app/layout.tsx to set the data-theme attribute on <html>
 * before any client JS runs - no FOUC.
 */
export async function getServerTheme(): Promise<ThemeMode> {
  const store = await cookies();
  const cookie = store.get(THEME_COOKIE);
  return cookie?.value === 'light' ? 'light' : 'dark';
}

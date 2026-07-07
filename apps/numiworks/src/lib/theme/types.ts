// Shared types and constants for the theme system. Imported by both the
// server reader (get-server-theme.ts, uses next/headers) and the client
// provider (theme-provider.tsx). No JSX, no React, no Next imports - safe
// to import from anywhere.

export type ThemeMode = 'dark' | 'light';

export const THEME_COOKIE = 'stayscout-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

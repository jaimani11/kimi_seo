'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type ThemeMode } from './types';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ initial, children }: { initial: ThemeMode; children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(initial);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.cookie = `${THEME_COOKIE}=${mode}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Sync attribute if prop changes (e.g. on first hydration)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

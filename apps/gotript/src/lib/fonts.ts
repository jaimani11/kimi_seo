import { Fraunces, Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-fraunces',
  weight: 'variable',
  style: ['normal', 'italic'],
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: 'variable',
});

export const geistMono = GeistMono;

/**
 * Combined font variable className for <html>.
 * Applied once in app/layout.tsx so every component can read --font-* vars.
 */
export const fontVariables = [fraunces.variable, inter.variable, geistMono.variable].join(' ');

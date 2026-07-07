# StayScout Slice A1 - Foundation & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js 15 + TypeScript strict project with Tailwind v4, design tokens, three fonts via `next/font`, ESLint boundary enforcement, the full folder skeleton, a working theme toggle, and a minimal landing shell that renders the cinematic dark + boutique-light theme correctly. After A1, `pnpm dev` produces a believable visual foundation; no agents, providers, or streaming yet.

**Architecture:** Single Next.js 15 App Router app, Node runtime. Strict layer boundaries enforced by `eslint-plugin-boundaries`. Design tokens live in `src/styles/tokens.css` exposed via Tailwind v4 `@theme`. Three fonts via `next/font` (Fraunces / Inter / Geist Mono). Theme persistence via cookie to prevent FOUC.

**Tech Stack:** Next.js 15, TypeScript strict, React 19, Tailwind CSS v4, pnpm 9+, ESLint + `eslint-plugin-boundaries`, `next/font`, Framer Motion, `lucide-react`. Node 22 LTS.

**Spec reference:** [docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md](../specs/2026-05-08-stayscout-slice-a-design.md)

---

## Slice A roadmap (context - only A1 is in this plan)

| Slice | Title | Status |
|---|---|---|
| **A1** | **Foundation & Design System** | **← this plan** |
| A2 | Core Contracts (types, Zod schemas) | next plan after A1 review |
| A3 | Mock Italy Provider + Curation Library | |
| A4 | ModelClient + IntentAgent | |
| A5 | Orchestrator + Streaming Protocol | |
| A6 | LLM-Synthesized Provider + MoodSnapshotAgent | |
| A7 | Workspace Shell + Chat Sidebar | |
| A8 | Trip Board Canvas (the materialization moment) | |
| A9 | Refine Flow + Compare + Memory Hints + Detail View | |
| A10 | Marketing Sections + Mobile Fallback + Polish & Deploy | |

Each subsequent slice gets its own plan after the previous is reviewed.

---

## Slice A1 file structure

What this plan creates or modifies:

```
stayscout/
├── .github/workflows/ci.yml             [new] typecheck + lint on PR
├── .eslintrc.cjs                        [new] boundary rules + Next config
├── .prettierrc.json                     [new] code style
├── .npmrc                               [new] pnpm config
├── README.md                            [new] quick-start + layer rules
├── package.json                         [new] deps + scripts
├── pnpm-workspace.yaml                  [new] single-package today, ready to split
├── next.config.ts                       [new] image remotePatterns for Unsplash
├── tsconfig.json                        [new] strict TS + path aliases
├── postcss.config.mjs                   [new] Tailwind v4
├── public/
│   └── icons/
│       └── sparkle.svg                  [new] custom AI/concierge motif
├── src/
│   ├── app/
│   │   ├── layout.tsx                   [new] root layout: fonts, theme, body classes
│   │   ├── page.tsx                     [new] minimal landing shell for A1
│   │   └── not-found.tsx                [new] 404
│   ├── core/index.ts                    [new] empty (types come in A2)
│   ├── agents/index.ts                  [new] empty (agents come in A4/A6)
│   ├── providers/index.ts               [new] empty (providers come in A3/A6)
│   ├── orchestrator/index.ts            [new] empty (orchestrator comes in A5)
│   ├── lib/
│   │   ├── fonts.ts                     [new] next/font config + exports
│   │   └── theme/
│   │       ├── types.ts                 [new] shared THEME_COOKIE + ThemeMode (no JSX)
│   │       ├── theme-provider.tsx       [new] React context + cookie persistence
│   │       ├── theme-toggle.tsx         [new] toggle component
│   │       └── get-server-theme.ts      [new] read theme cookie in RSC
│   ├── features/
│   │   ├── landing/
│   │   │   ├── workspace-shell-placeholder.tsx  [new] minimal A1 hero
│   │   │   └── header.tsx               [new] wordmark + status + theme toggle
│   │   └── shared/
│   │       ├── icons/
│   │       │   ├── sparkle.tsx          [new] inline SVG component
│   │       │   └── index.ts             [new] re-export of lucide + sparkle
│   │       └── motion/
│   │           └── reduced-motion.ts    [new] hook + utility
│   └── styles/
│       ├── globals.css                  [new] base styles + Tailwind import
│       └── tokens.css                   [new] @theme + CSS custom properties
├── tests/
│   └── boundary-violation.smoke.ts      [new] deliberate violation to verify lint catches it
└── vercel.json                          [new] minimal deploy config
```

Total: 30 new files. No modifications (greenfield slice).

Note on `src/lib/fonts.ts` vs `src/lib/theme/`: `fonts` is a single file, not a folder; `theme` is a folder with multiple files. Don't `mkdir src/lib/fonts/` - it would shadow the file path.

---

## Task 1: Initialize project with pnpm + Next.js 15

**Files:**
- Create: `package.json`, `.npmrc`, `pnpm-workspace.yaml`

- [ ] **Step 1: Verify Node and pnpm versions**

Run:
```bash
node --version    # expect: v22.x.x
pnpm --version    # expect: 9.x or 10.x
```

If pnpm is missing: `corepack enable && corepack prepare pnpm@latest --activate`

- [ ] **Step 2: Create `.npmrc` to enable strict-peer-deps**

Create `.npmrc`:
```
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`** (single-package today, ready to split)

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - .
```

- [ ] **Step 4: Create `package.json`**

Create `package.json`:
```json
{
  "name": "stayscout",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 5: Install Next.js 15 + React 19 + TypeScript**

Run:
```bash
pnpm add next@latest react@latest react-dom@latest
pnpm add -D typescript @types/node @types/react @types/react-dom
```

Expected: `next` ≥ 15.0, `react` ≥ 19.0, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml
git commit -m "chore: initialize pnpm workspace with Next.js 15 + React 19"
```

---

## Task 2: TypeScript strict configuration with path aliases

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Create `tsconfig.json` with strict mode and `@/*` aliases**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@agents/*": ["./src/agents/*"],
      "@providers/*": ["./src/providers/*"],
      "@orchestrator/*": ["./src/orchestrator/*"],
      "@lib/*": ["./src/lib/*"],
      "@features/*": ["./src/features/*"],
      "@styles/*": ["./src/styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Note: `exactOptionalPropertyTypes` is intentionally `false` - `true` is too strict for our `Partial<>`-heavy contracts (TripIntent.confidence) and would generate friction for no gain.

- [ ] **Step 2: Run typecheck (expect zero errors, even with no source files yet)**

Run: `pnpm typecheck`
Expected: completes silently with exit 0. (The `tsc --noEmit` against a project with no `.ts` files passes trivially.)

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add TypeScript strict config with layer path aliases"
```

---

## Task 3: Folder skeleton + placeholder index files

**Files:**
- Create: `src/core/index.ts`, `src/agents/index.ts`, `src/providers/index.ts`, `src/orchestrator/index.ts`, `src/lib/.gitkeep`, `src/features/.gitkeep`, `src/styles/.gitkeep`, `src/app/.gitkeep`

The folder skeleton goes in now so ESLint boundary rules in Task 6 can validate against real paths.

- [ ] **Step 1: Create the layer folders**

Run:
```bash
mkdir -p src/{core,agents,providers,orchestrator,lib,features,app,styles}
mkdir -p src/lib/{ai,streaming,session,photos,quality,curation,evaluation,theme}
mkdir -p src/features/{landing,workspace,shared}
mkdir -p src/features/shared/{primitives,motion,icons,sound}
mkdir -p tests
mkdir -p public/icons
```

Note: `src/lib/fonts.ts` is a file (created in Task 6), not a folder - do not `mkdir src/lib/fonts`.

- [ ] **Step 2: Create placeholder `index.ts` for each layer with a doc comment**

Create `src/core/index.ts`:
```ts
// Layer: core
// Deps: none (no runtime, no React, no Next imports)
// Provides: types, contracts, discriminated unions, Zod schemas (Slice A2+)

export {};
```

Create `src/agents/index.ts`:
```ts
// Layer: agents
// Deps: core, lib
// Provides: Agent<I, O> implementations (IntentAgent, MoodSnapshotAgent in Slice A4+)

export {};
```

Create `src/providers/index.ts`:
```ts
// Layer: providers
// Deps: core, lib
// Provides: Provider implementations + ProviderRegistry + routeProvider() (Slice A3+)

export {};
```

Create `src/orchestrator/index.ts`:
```ts
// Layer: orchestrator
// Deps: core, agents, providers, lib
// Provides: Orchestrator class + event factories + JSONL stream serialization (Slice A5+)

export {};
```

- [ ] **Step 3: Add `.gitkeep` to subfolders that stay empty through A1**

Folders that get real files later in this plan (`theme/`, `landing/`, `shared/icons/`, `shared/motion/`) don't need `.gitkeep`. Only empty A1 folders do.

Run:
```bash
touch src/lib/{ai,streaming,session,photos,quality,curation,evaluation}/.gitkeep
touch src/features/workspace/.gitkeep
touch src/features/shared/{primitives,sound}/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "chore: scaffold layered folder structure with placeholder indices"
```

---

## Task 4: Tailwind CSS v4 setup with PostCSS

**Files:**
- Create: `postcss.config.mjs`, `src/styles/globals.css`

- [ ] **Step 1: Install Tailwind v4 + PostCSS plugin**

Run:
```bash
pnpm add -D tailwindcss@latest @tailwindcss/postcss postcss
```

Expected: `tailwindcss` ≥ 4.0.

- [ ] **Step 2: Create `postcss.config.mjs`**

Create `postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 3: Create `src/styles/globals.css`** (minimal - `tokens.css` follows in Task 5)

Create `src/styles/globals.css`:
```css
@import "tailwindcss";
@import "./tokens.css";

/* Base reset for our app's specific needs (Tailwind preflight handles most) */
html, body {
  height: 100%;
}

body {
  background: var(--surface-base);
  color: var(--ink-primary);
  font-family: var(--font-inter), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color var(--dur-slow) var(--ease-in-out),
              color var(--dur-slow) var(--ease-in-out);
}

/* prevent page-level scroll-jank during theme transitions */
* {
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 200ms !important;
    transition-duration: 200ms !important;
  }
}
```

- [ ] **Step 4: Commit (we'll commit again after tokens.css in Task 5; this is a checkpoint)**

```bash
git add postcss.config.mjs src/styles/globals.css
git commit -m "chore: install Tailwind v4 and add globals.css scaffold"
```

---

## Task 5: Design tokens (`tokens.css`) - colors, type, spacing, motion, glass

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Create `src/styles/tokens.css` with the full token set from spec §4**

Create `src/styles/tokens.css`:
```css
/* ============================================================
   StayScout Design Tokens - spec §4
   Two themes (cinematic dark / boutique-sunset light) plus a
   theme-independent --featured-* set for the marketing break.
   ============================================================ */

@theme {
  /* Typography (font families come from next/font; we only declare scale here) */
  --text-display-xl: 4.5rem;
  --text-display-lg: 3.5rem;
  --text-display-md: 2.25rem;
  --text-display-sm: 1.625rem;
  --text-body-lg: 1.125rem;
  --text-body: 1rem;
  --text-body-sm: 0.875rem;
  --text-label: 0.75rem;
  --text-mono: 0.8125rem;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 22px;
  --radius-full: 9999px;

  /* Motion */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-instant: 100ms;
  --dur-fast: 200ms;
  --dur-base: 350ms;
  --dur-slow: 600ms;
  --dur-cinematic: 900ms;
}

/* ============== DARK MODE (default - cinematic) ============== */
:root,
:root[data-theme="dark"] {
  --surface-base: #0B0D10;
  --surface-raised: #14171C;
  --surface-elevated: rgba(255, 255, 255, 0.04);
  --surface-overlay: rgba(255, 255, 255, 0.06);

  --ink-primary: #EDE6DB;
  --ink-secondary: rgba(237, 230, 219, 0.65);
  --ink-tertiary: rgba(237, 230, 219, 0.40);

  --accent-primary: #D4A574;
  --accent-primary-soft: rgba(212, 165, 116, 0.16);
  --accent-primary-glow: rgba(212, 165, 116, 0.40);
  --accent-secondary: #5078C8;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-emphasis: rgba(255, 255, 255, 0.14);

  --bloom-warm: radial-gradient(ellipse 80% 60% at 70% 20%,
                  rgba(212, 165, 116, 0.14) 0%, transparent 60%);
  --bloom-cool: radial-gradient(ellipse 60% 50% at 20% 90%,
                  rgba(80, 120, 200, 0.10) 0%, transparent 60%);

  --elev-card:
    0 8px 24px -8px rgb(0 0 0 / 0.50),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  --elev-hero:
    0 18px 40px -12px rgb(0 0 0 / 0.55),
    0 0 0 1px rgb(255 255 255 / 0.06),
    inset 0 1px 0 rgb(255 255 255 / 0.06);

  color-scheme: dark;
}

/* ============== LIGHT MODE (boutique sunset) ============== */
:root[data-theme="light"] {
  --surface-base: #F4EFE6;
  --surface-raised: #FAF6EC;
  --surface-elevated: #FFFFFF;
  --surface-overlay: rgba(42, 42, 31, 0.04);

  --ink-primary: #2A2A1F;
  --ink-secondary: rgba(42, 42, 31, 0.65);
  --ink-tertiary: rgba(42, 42, 31, 0.40);

  --accent-primary: #5A6B3F;
  --accent-primary-soft: rgba(90, 107, 63, 0.12);
  --accent-primary-glow: rgba(90, 107, 63, 0.30);
  --accent-secondary: #B0552F;

  --border-subtle: rgba(42, 42, 31, 0.10);
  --border-emphasis: rgba(42, 42, 31, 0.18);

  --bloom-warm: radial-gradient(ellipse 80% 60% at 70% 20%,
                  rgba(176, 85, 47, 0.08) 0%, transparent 60%);
  --bloom-cool: radial-gradient(ellipse 60% 50% at 20% 90%,
                  rgba(90, 107, 63, 0.06) 0%, transparent 60%);

  --elev-card:
    0 1px 2px rgb(42 42 31 / 0.06),
    0 1px 1px rgb(42 42 31 / 0.03);
  --elev-hero:
    0 24px 56px -20px rgb(42 42 31 / 0.25),
    0 8px 16px rgb(42 42 31 / 0.05);

  color-scheme: light;
}

/* ============== FIXED BOUTIQUE-LIGHT TOKENS ==============
   For the "Featured stays" marketing section break - keeps boutique
   identity regardless of global theme. Spec §4.1.
*/
:root {
  --featured-bg: #F4EFE6;
  --featured-bg-raised: #FAF6EC;
  --featured-ink-primary: #2A2A1F;
  --featured-ink-secondary: rgba(42, 42, 31, 0.65);
  --featured-accent: #5A6B3F;
  --featured-accent-clay: #B0552F;
  --featured-border: rgba(42, 42, 31, 0.14);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add design tokens for dark/light themes plus fixed featured-* set"
```

---

## Task 6: Font setup with `next/font` (Fraunces × Inter × Geist Mono)

**Files:**
- Create: `src/lib/fonts.ts`

- [ ] **Step 1: Create `src/lib/fonts.ts`**

Create `src/lib/fonts.ts`:
```ts
import { Fraunces, Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-fraunces',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600'],
});

export const geistMono = GeistMono;

/**
 * Combined font variable className for <html>.
 * Applied once in app/layout.tsx so every component can read --font-* vars.
 */
export const fontVariables = [
  fraunces.variable,
  inter.variable,
  geistMono.variable,
].join(' ');
```

- [ ] **Step 2: Install Geist (which provides `geist/font/mono`)**

Run:
```bash
pnpm add geist
```

Expected: package added; no peer-dep warnings.

- [ ] **Step 3: Verify the import resolves**

Run: `pnpm typecheck`
Expected: passes with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/fonts.ts package.json pnpm-lock.yaml
git commit -m "feat: add next/font config for Fraunces × Inter × Geist Mono"
```

---

## Task 7: Theme provider + cookie persistence (no FOUC)

**Files:**
- Create: `src/lib/theme/types.ts`, `src/lib/theme/get-server-theme.ts`, `src/lib/theme/theme-provider.tsx`, `src/lib/theme/theme-toggle.tsx`

The theme is read on the server from a cookie before HTML is sent - preventing the FOUC that happens with client-only theme libraries. The shared cookie name and `ThemeMode` type live in a tiny `types.ts` so both the server reader and the client provider stay DRY without crossing the server/client line.

- [ ] **Step 1: Create the shared types module**

Create `src/lib/theme/types.ts`:
```ts
// Shared types and constants for the theme system. Imported by both the
// server reader (get-server-theme.ts, uses next/headers) and the client
// provider (theme-provider.tsx). No JSX, no React, no Next imports - safe
// to import from anywhere.

export type ThemeMode = 'dark' | 'light';

export const THEME_COOKIE = 'stayscout-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
```

- [ ] **Step 2: Create `get-server-theme.ts` to read cookie in RSC**

Create `src/lib/theme/get-server-theme.ts`:
```ts
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
```

- [ ] **Step 3: Create `theme-provider.tsx` (Client component, hydrates from server-set value)**

Create `src/lib/theme/theme-provider.tsx`:
```tsx
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

export function ThemeProvider({
  initial,
  children,
}: {
  initial: ThemeMode;
  children: ReactNode;
}) {
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
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
```

- [ ] **Step 4: Create `theme-toggle.tsx`**

Create `src/lib/theme/theme-toggle.tsx`:
```tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        inline-flex h-8 w-8 items-center justify-center rounded-full
        text-[color:var(--ink-secondary)]
        transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]
        hover:text-[color:var(--ink-primary)]
        hover:bg-[color:var(--surface-overlay)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[color:var(--accent-primary-glow)]
      "
    >
      <Icon className="h-4 w-4" strokeWidth={1.6} />
    </button>
  );
}
```

- [ ] **Step 5: Install `lucide-react`**

Run:
```bash
pnpm add lucide-react
```

- [ ] **Step 6: Verify typecheck still clean**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/theme/ package.json pnpm-lock.yaml
git commit -m "feat: add theme provider with cookie persistence (no FOUC)"
```

---

## Task 8: Custom sparkle SVG icon + icon barrel

**Files:**
- Create: `public/icons/sparkle.svg`, `src/features/shared/icons/sparkle.tsx`, `src/features/shared/icons/index.ts`

The sparkle is the AI/concierge motif - appears in input bars, AI message prefixes, agent step bullets, and the docked-input symbol.

- [ ] **Step 1: Create `public/icons/sparkle.svg` (for `next/image` if ever needed)**

Create `public/icons/sparkle.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 2 L13.5 9 L21 12 L13.5 15 L12 22 L10.5 15 L3 12 L10.5 9 Z"/>
</svg>
```

- [ ] **Step 2: Create the React component**

Create `src/features/shared/icons/sparkle.tsx`:
```tsx
import type { SVGProps } from 'react';

export function Sparkle({
  size = 16,
  strokeWidth: _ = 1.6,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2 L13.5 9 L21 12 L13.5 15 L12 22 L10.5 15 L3 12 L10.5 9 Z" />
    </svg>
  );
}
```

- [ ] **Step 3: Create the icons barrel**

Create `src/features/shared/icons/index.ts`:
```ts
// Re-export the lucide icons we use, plus our custom sparkle.
// New icons added here on demand - keeps imports tidy and lets us swap
// implementations later without touching call sites.

export { Sparkle } from './sparkle';
export {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Moon,
  Send,
  Sun,
  X,
} from 'lucide-react';
```

- [ ] **Step 4: Commit**

```bash
git add public/icons/ src/features/shared/icons/
git commit -m "feat: add sparkle motif and icon barrel"
```

---

## Task 9: Reduced-motion utility hook

**Files:**
- Create: `src/features/shared/motion/reduced-motion.ts`

- [ ] **Step 1: Install Framer Motion**

Run:
```bash
pnpm add framer-motion
```

- [ ] **Step 2: Create the reduced-motion hook**

Create `src/features/shared/motion/reduced-motion.ts`:
```ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether the user has requested reduced motion. SSR-safe: always
 * returns `false` on the server, then updates after hydration. Use this to
 * gate cinematic motion (shimmer, materialize, breathe) - fall back to a
 * 200ms cross-fade when true. Spec §4.5.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Server-safe motion config builder. Component code passes its preferred
 * config, and we either return it or a degraded fallback. Helps keep the
 * "200ms fade fallback" rule (spec §4.5) consistent across components.
 */
export function motionWithFallback<T>(
  preferred: T,
  fallback: T,
  reduced: boolean,
): T {
  return reduced ? fallback : preferred;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/shared/motion/ package.json pnpm-lock.yaml
git commit -m "feat: add useReducedMotion hook + motionWithFallback helper"
```

---

## Task 10: Root layout with fonts + theme + bloom background

**Files:**
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/app/layout.tsx`**

Create `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { fontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { getServerTheme } from '@/lib/theme/get-server-theme';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'StayScout - Travel concierge software',
  description:
    'AI-native travel orchestration. Describe your trip in a sentence; specialized agents handle the rest.',
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  ),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = await getServerTheme();

  return (
    <html lang="en" data-theme={theme} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider initial={theme}>
          <div
            className="
              relative min-h-screen
            "
            style={{
              backgroundColor: 'var(--surface-base)',
              backgroundImage: 'var(--bloom-warm), var(--bloom-cool)',
              backgroundAttachment: 'fixed',
            }}
          >
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Notes:
- `getServerTheme()` runs in RSC, so `data-theme` is present on first byte → no FOUC.
- `suppressHydrationWarning` on `<html>` is appropriate because the cookie-driven theme can briefly diverge if a different tab has changed it.
- The bloom layers are applied at the layout level so they show beneath every page. `background-attachment: fixed` keeps them anchored as the user scrolls past the workspace into marketing sections.

- [ ] **Step 2: Commit (page.tsx in next task - verify build only after that)**

```bash
git add src/app/layout.tsx
git commit -m "feat: add root layout with server-resolved theme and bloom background"
```

---

## Task 11: A1 landing shell - header + placeholder hero

**Files:**
- Create: `src/features/landing/header.tsx`, `src/features/landing/workspace-shell-placeholder.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`

This is the visual milestone for A1: a single page that proves the design system works. It will be replaced by the real workspace in Slice A7 - but for A1 it's the artifact we use to verify fonts, tokens, theme toggle, and bloom.

- [ ] **Step 1: Create the header**

Create `src/features/landing/header.tsx`:
```tsx
import { ThemeToggle } from '@/lib/theme/theme-toggle';

export function Header() {
  return (
    <header
      className="
        sticky top-0 z-20
        flex items-center justify-between
        px-6 py-4
        backdrop-blur-[8px]
      "
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[color:var(--ink-primary)]"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '1.05rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          stayscout
        </span>
        <span
          className="
            hidden sm:inline-block
            rounded-full
            px-2 py-0.5
            text-[color:var(--ink-tertiary)]
            border border-[color:var(--border-subtle)]
          "
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.625rem',
            letterSpacing: '0.04em',
          }}
        >
          v0.1 · public preview
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
```

- [ ] **Step 2: Create the workspace-shell placeholder** (gets replaced in Slice A7)

Create `src/features/landing/workspace-shell-placeholder.tsx`:
```tsx
import { Sparkle } from '@/features/shared/icons';

export function WorkspaceShellPlaceholder() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div
          className="mb-6 inline-flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          <Sparkle size={12} style={{ color: 'var(--accent-primary)' }} />
          Foundation · Slice A1
        </div>

        <h1
          className="mb-6"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg)',
            fontWeight: 300,
            lineHeight: 1.0,
            letterSpacing: '-0.035em',
            color: 'var(--ink-primary)',
          }}
        >
          Your next stay,
          <br />
          <em
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--accent-primary)',
            }}
          >
            intelligently found.
          </em>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-body)',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
          }}
        >
          The visual foundation is in. Workspace, agents, and Trip Board come
          online in subsequent slices.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create the page**

Create `src/app/page.tsx`:
```tsx
import { Header } from '@/features/landing/header';
import { WorkspaceShellPlaceholder } from '@/features/landing/workspace-shell-placeholder';

export default function Page() {
  return (
    <>
      <Header />
      <WorkspaceShellPlaceholder />
    </>
  );
}
```

- [ ] **Step 4: Create the 404 page**

Create `src/app/not-found.tsx`:
```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          404
        </p>
        <h1
          className="mt-3 mb-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-md)',
            fontWeight: 400,
            color: 'var(--ink-primary)',
          }}
        >
          Off the trail.
        </h1>
        <Link
          href="/"
          className="inline-block underline"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--accent-primary)',
          }}
        >
          Back to the workspace
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run dev server and verify**

Run:
```bash
pnpm dev
```

Open `http://localhost:3000` and verify:
- Background is near-black `#0B0D10` with visible warm + cool blooms
- Header shows `stayscout` wordmark in Fraunces and `v0.1 · public preview` in Geist Mono
- Hero "intelligently found" has italic gold accent on the word
- Theme toggle (top-right) switches to cream boutique-light: cream surface, deep ink type, olive accent on italic phrase
- Reload after toggling - theme persists (no FOUC flash)

Stop dev server (`Ctrl+C`) once verified.

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/not-found.tsx src/features/landing/
git commit -m "feat: add A1 landing shell with header and placeholder hero"
```

---

## Task 12: Next.js config - image remote patterns + experimental flags

**Files:**
- Create: `next.config.ts`

- [ ] **Step 1: Create `next.config.ts`**

Create `next.config.ts`:
```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Slice A photos come from Unsplash. Real-provider domains added in Slice B.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Tailwind v4 + RSC works fine without these; left empty intentionally.
  },
};

export default config;
```

- [ ] **Step 2: Verify dev still works with config**

Run:
```bash
pnpm build
```

Expected: build completes, output shows static `/` and `/_not-found` routes. No errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: add next.config.ts with Unsplash image remotePatterns"
```

---

## Task 13: ESLint with `eslint-plugin-boundaries` + Next plugin

**Files:**
- Create: `.eslintrc.cjs`, `tests/boundary-violation.smoke.ts`

Layer boundaries are the single most important quality gate in the architecture. We verify the rule with a deliberate violation in a smoke test, then remove it.

- [ ] **Step 1: Install ESLint + plugins**

Run:
```bash
pnpm add -D \
  eslint@latest \
  eslint-config-next@latest \
  eslint-plugin-boundaries \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

- [ ] **Step 2: Create `.eslintrc.cjs` with boundary rules**

Create `.eslintrc.cjs`:
```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'boundaries'],
  extends: ['next/core-web-vitals', 'next/typescript'],
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'src/core/*' },
      { type: 'lib', pattern: 'src/lib/*' },
      { type: 'agents', pattern: 'src/agents/*' },
      { type: 'providers', pattern: 'src/providers/*' },
      { type: 'orchestrator', pattern: 'src/orchestrator/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'app', pattern: 'src/app/*' },
      { type: 'styles', pattern: 'src/styles/*' },
      { type: 'tests', pattern: 'tests/*' },
    ],
    'boundaries/include': ['src/**/*', 'tests/**/*'],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'core', allow: ['core'] },
          { from: 'lib', allow: ['core', 'lib'] },
          { from: 'agents', allow: ['core', 'lib'] },
          { from: 'providers', allow: ['core', 'lib'] },
          { from: 'orchestrator', allow: ['core', 'lib', 'agents', 'providers'] },
          { from: 'features', allow: ['core', 'lib', 'agents', 'providers', 'orchestrator', 'features', 'styles'] },
          { from: 'app', allow: ['core', 'lib', 'agents', 'providers', 'orchestrator', 'features', 'styles'] },
          { from: 'styles', allow: ['styles'] },
          { from: 'tests', allow: ['core', 'lib', 'agents', 'providers', 'orchestrator', 'features'] },
        ],
      },
    ],
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['react', 'next', 'next/*'], message: 'Imports of react/next are forbidden in src/core. Move to lib or features.', importNames: ['*'] },
      ],
    }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  },
  overrides: [
    // Loosen no-restricted-imports outside core
    {
      files: ['src/lib/**', 'src/agents/**', 'src/providers/**', 'src/orchestrator/**', 'src/features/**', 'src/app/**', 'tests/**'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
  ignorePatterns: ['node_modules/', '.next/', 'out/', 'build/', 'dist/'],
};
```

- [ ] **Step 3: Run lint, expect a zero-issue baseline**

Run:
```bash
pnpm lint
```

Expected: zero errors, zero warnings. (No source file in `src/core/` imports React or Next, no boundary violations.)

- [ ] **Step 4: Verify the boundary rule catches a deliberate violation**

We temporarily add an upward import from `core` to `agents` (which the rules disallow), confirm lint catches it, then revert. The violation lives in `src/core/index.ts` because `core` is the most-restricted layer.

Replace `src/core/index.ts` with:
```ts
// Layer: core
// Deps: none (no runtime, no React, no Next imports)
// Provides: types, contracts, discriminated unions, Zod schemas (Slice A2+)

// TEMPORARY DELIBERATE BOUNDARY VIOLATION - REVERTED IN STEP 6
import '@/agents';

export {};
```

- [ ] **Step 5: Run lint and verify it catches the violation**

Run:
```bash
pnpm lint 2>&1 | grep -i "boundaries"
```

Expected: see a `boundaries/element-types` error mentioning `src/core` importing from `agents`. The `pnpm lint` exit code is non-zero.

- [ ] **Step 6: Restore `src/core/index.ts` to its clean state**

Re-create `src/core/index.ts`:
```ts
// Layer: core
// Deps: none (no runtime, no React, no Next imports)
// Provides: types, contracts, discriminated unions, Zod schemas (Slice A2+)

export {};
```

- [ ] **Step 7: Confirm lint is clean again**

Run: `pnpm lint`
Expected: zero errors, zero warnings.

- [ ] **Step 8: Commit**

```bash
git add .eslintrc.cjs src/core/index.ts package.json pnpm-lock.yaml
git commit -m "feat: add ESLint with boundary enforcement (verified end-to-end)"
```

---

## Task 14: Prettier formatting

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`

- [ ] **Step 1: Install Prettier**

Run:
```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2: Create `.prettierrc.json`**

Create `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Create `.prettierignore`**

Create `.prettierignore`:
```
node_modules/
.next/
out/
build/
dist/
public/
pnpm-lock.yaml
*.md
```

(Markdown excluded so spec/plan formatting isn't disturbed.)

- [ ] **Step 4: Run format, expect no changes**

Run:
```bash
pnpm format:check
```

If it fails on any file, run `pnpm format` and inspect the diff.

- [ ] **Step 5: Commit**

```bash
git add .prettierrc.json .prettierignore package.json pnpm-lock.yaml
git commit -m "chore: add Prettier with Tailwind plugin"
```

---

## Task 15: GitHub Actions CI (typecheck + lint + format check)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck + lint + format-check + build pipeline"
```

---

## Task 16: Vercel config (minimal)

**Files:**
- Create: `vercel.json`

Vercel auto-detects Next.js - `vercel.json` only carries overrides we actually need.

- [ ] **Step 1: Create `vercel.json`**

Create `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add minimal vercel.json"
```

---

## Task 17: README with quick-start and layer rules

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

Create `README.md`:
````markdown
# StayScout AI

> AI-native travel orchestration. Describe your trip in a sentence; specialized agents handle the rest.

## Status

**Slice A1 - Foundation & Design System** complete. The visual foundation is in (cinematic dark + boutique-light themes, Fraunces × Inter × Geist Mono typography, design tokens, theme toggle with no FOUC). Workspace, agents, and Trip Board come online in subsequent slices.

Spec: [`docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md`](docs/superpowers/specs/2026-05-08-stayscout-slice-a-design.md)
Plans: [`docs/superpowers/plans/`](docs/superpowers/plans/)

## Quick start

Requires Node 22 LTS and pnpm 9+ (or 10).

```bash
pnpm install
pnpm dev          # → http://localhost:3000
```

## Scripts

```
pnpm dev            Start the dev server (Turbopack)
pnpm build          Production build
pnpm start          Run the production server
pnpm typecheck      Run TypeScript without emitting
pnpm lint           ESLint (boundaries + Next + TS)
pnpm format         Format with Prettier
pnpm format:check   Verify formatting (used in CI)
```

## Architecture: layered folders

The src tree is split into layers with strict ESLint-enforced boundaries. Adding a feature should never tempt anyone to break these.

```
src/
  core/           types & contracts only - no runtime, no React, no Next imports
  agents/         Agent implementations           ← deps: core, lib
  providers/      Provider implementations        ← deps: core, lib
  orchestrator/   Orchestrator + event stream    ← deps: core, agents, providers, lib
  lib/            model client, streaming, fonts, photos, session, quality,
                  curation, evaluation, theme    ← deps: core
  features/       UI features by domain          ← deps: anything except app
  app/            Next.js routes - thin glue     ← deps: anything
  styles/         design tokens, globals.css
```

Allowed import direction: `app → features → orchestrator → agents/providers → lib → core`.
The reverse fails CI.

## Slice roadmap

| Slice | Status |
|---|---|
| A1 - Foundation & Design System | ✓ |
| A2 - Core Contracts | next |
| A3 - Mock Italy Provider + Curation Library | |
| A4 - ModelClient + IntentAgent | |
| A5 - Orchestrator + Streaming Protocol | |
| A6 - LLM-Synthesized Provider + MoodSnapshotAgent | |
| A7 - Workspace Shell + Chat Sidebar | |
| A8 - Trip Board Canvas (materialization) | |
| A9 - Refine Flow + Compare + Memory Hints + Detail View | |
| A10 - Marketing Sections + Mobile Fallback + Polish & Deploy | |
| B / C / D | (after A is shipped) |

## Conventions

- TDD where it makes sense (logic, parsers, agents, providers). Visual scaffolding gets manual verification.
- Single source of truth for UI state lives in Zustand (Slice A7+). No component-local state for non-ephemeral data.
- The Provider interface is sacred - every real-world inventory source must fit through it.
- Optional polish (mood snapshots, memory hints) must never block the critical path.
- Editorial voice: fragments and italics, never paragraphs and exclamations. No "discover", "unforgettable", "hidden gem", "journey".

## License

Proprietary - all rights reserved (placeholder until license decision).
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick-start, scripts, and layer rules"
```

---

## Task 18: Slice A1 final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full quality pipeline locally**

Run:
```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Expected: all five pass with zero errors. Build output shows `/` and `/_not-found` as static routes.

- [ ] **Step 2: Manual visual verification**

Run: `pnpm dev`, open `http://localhost:3000`.

Verify:
- [ ] Background is near-black `#0B0D10`; warm-gold bloom visible top-right; cool-blue bloom visible bottom-left
- [ ] Header `stayscout` is in Fraunces, `v0.1 · public preview` is in Geist Mono
- [ ] Hero text "intelligently found" is italic in warm gold (`#D4A574`)
- [ ] Theme toggle (top-right): clicks switch to cream boutique-light. Olive accent (`#5A6B3F`) on the italic phrase. Bloom warmth shifts subtly.
- [ ] Reload after switching - theme persists, **no white flash**
- [ ] Run with `prefers-reduced-motion: reduce` enabled in DevTools - page renders without animation issues (theme transition still works, capped at 200ms via globals.css rule)

Stop the dev server.

- [ ] **Step 3: Commit any outstanding changes (should be none)**

Run: `git status`
Expected: `working tree clean`.

- [ ] **Step 4: Push to GitHub (optional - gates A1 review)**

If a remote is set:
```bash
git push -u origin main
```

Verify CI runs and passes.

- [ ] **Step 5: Tag the slice**

```bash
git tag -a slice-a1 -m "Slice A1 complete: foundation + design system"
git push --tags    # if remote set
```

---

## Self-review checklist

Run this before declaring A1 done.

**1. Spec coverage** (each item from spec §4 - Design System):
- [x] Color tokens (dark + light) - Task 5
- [x] Featured fixed token set - Task 5
- [x] Typography scale - Task 5
- [x] Font loading (Fraunces + Inter + Geist Mono) - Task 6
- [x] Spacing & radii - Task 5 (radii); Tailwind defaults handle spacing
- [x] Elevation tokens - Task 5
- [x] Motion tokens (easing, duration) - Task 5
- [x] Reduced-motion support - Task 9 + globals.css in Task 4
- [x] Glass usage rules - codified, applied in Slices A7+
- [x] Photo treatment rules - applied in Slice A3+
- [x] Icon system (Lucide + custom Sparkle) - Task 8
- [x] shadcn primitives - installed selectively in later slices
- [x] Sound stub - deferred per spec §4.10
- [x] Layered folder structure - Task 3
- [x] ESLint boundary enforcement - Task 13
- [x] Theme toggle with cookie persistence (no FOUC) - Task 7

**2. Spec coverage** (cross-cutting):
- [x] Node runtime - confirmed in next.config.ts (no edge config)
- [x] Vercel deploy target - Task 16
- [x] CI - Task 15

**3. Placeholder scan:** No "TBD", "TODO", "fill in details" in any task. ✓

**4. Type/symbol consistency:**
- `getServerTheme()` (Task 7) is called from `app/layout.tsx` (Task 10) - names match.
- `THEME_COOKIE` and `ThemeMode` live in `src/lib/theme/types.ts` (Task 7 Step 1) - both `get-server-theme.ts` and `theme-provider.tsx` import from there. No duplication.
- `fontVariables` in `lib/fonts.ts` (Task 6) is consumed in `app/layout.tsx` (Task 10) - names match.
- `Sparkle` (Task 8) re-exported from `features/shared/icons/index.ts` and consumed in `landing/workspace-shell-placeholder.tsx` (Task 11) - names match.

---

## After A1 is complete

Once A1 is shipped (`slice-a1` tag created, CI green, manual verification done):

1. Demo the live preview to confirm the foundation feels right.
2. Generate the **Slice A2 - Core Contracts** plan via writing-plans, informed by anything we learned in A1.
3. Continue.

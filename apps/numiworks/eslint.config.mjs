// ESLint 10 flat config.
// eslint-config-next 16 ships flat-config-ready arrays via /core-web-vitals
// and /typescript subpaths — we layer them, then add our own boundary
// guard so import direction stays additive across slices.

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';

const config = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
      '.next/dev/**',
    ],
  },

  // Next.js + React + a11y
  ...nextCoreWebVitals,
  // TypeScript-eslint recommended
  ...nextTypescript,

  // Project boundary rules
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'core', pattern: 'src/core/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'agents', pattern: 'src/agents/**' },
        { type: 'providers', pattern: 'src/providers/**' },
        { type: 'orchestrator', pattern: 'src/orchestrator/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'styles', pattern: 'src/styles/**' },
        { type: 'tests', pattern: 'tests/**' },
      ],
      'boundaries/include': ['src/**/*', 'tests/**/*'],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: [['core']], allow: [['core']] },
            { from: [['lib']], allow: [['core'], ['lib']] },
            { from: [['agents']], allow: [['core'], ['lib']] },
            { from: [['providers']], allow: [['core'], ['lib']] },
            {
              from: [['orchestrator']],
              allow: [['core'], ['lib'], ['agents'], ['providers']],
            },
            {
              from: [['features']],
              allow: [
                ['core'],
                ['lib'],
                ['agents'],
                ['providers'],
                ['orchestrator'],
                ['features'],
                ['styles'],
              ],
            },
            {
              from: [['app']],
              allow: [
                ['core'],
                ['lib'],
                ['agents'],
                ['providers'],
                ['orchestrator'],
                ['features'],
                ['styles'],
              ],
            },
            { from: [['styles']], allow: [['styles']] },
            {
              from: [['tests']],
              allow: [['core'], ['lib'], ['agents'], ['providers'], ['orchestrator'], ['features']],
            },
          ],
        },
      ],
    },
  },

  // src/core: forbid React/Next imports — core is pure types only.
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'next', 'next/*'],
              message:
                'src/core/ must remain runtime-free. Move React/Next dependencies to src/lib/ or src/features/.',
            },
          ],
        },
      ],
    },
  },
];

export default config;

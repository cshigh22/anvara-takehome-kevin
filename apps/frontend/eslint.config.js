import { reactConfig } from '@anvara/eslint-config';

export default [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // Frontend-specific rules
    },
  },
  {
    files: ['lib/utils.ts'],
    rules: {
      'no-console': 'off', // Logger module intentionally uses console
    },
  },
];

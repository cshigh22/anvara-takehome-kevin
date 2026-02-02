import { baseConfig } from '@anvara/eslint-config';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // Backend-specific rules
      'no-console': 'off', // Allow console in backend
    },
  },
  {
    files: ['prisma/**/*.ts'],
    rules: {
      'no-console': 'off', // Allow console in seed scripts
    },
  },
];

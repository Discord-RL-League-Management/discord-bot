// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nestjsTyped from '@darraghor/eslint-plugin-nestjs-typed';
import trilonPlugin from '@trilon/eslint-plugin';
import nestjsSecurity from 'eslint-plugin-nestjs-security';
import jestPlugin from 'eslint-plugin-jest';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'commitlint.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  ...nestjsTyped.configs.flatRecommended,
  {
    plugins: {
      '@trilon': trilonPlugin,
      'nestjs-security': nestjsSecurity,
    },
  },
  {
    rules: {
      ...trilonPlugin.configs.recommended.rules,
      ...nestjsSecurity.configs.recommended.rules,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // Disable Swagger rules for Discord bot (no REST API)
      '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'off',
      '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'off',
    },
  },
  // TQA Protocol: Jest-specific rules for test files
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      // TQA Pillar I: Static Analysis - Guarantee test verification
      'jest/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'fail'],
        },
      ],
      // TQA Pillar I: Static Analysis - Limit assertion count (enforce atomicity)
      'jest/max-expects': ['error', { max: 5 }],
      // TQA Pillar II: Test Isolation - Enforce robust mocking lifecycle
      'jest/prefer-spy-on': 'error',
      // TQA Pillar II: Test Isolation - Enforce proper lifecycle hooks
      'jest/require-hook': 'error',
      // TQA Pillar II: Test Isolation - Enforce test determinism
      'jest/no-conditional-in-test': 'error',
      // TQA Pillar III: Dynamic Observability - Asynchronous Safety (critical for E2E)
      '@typescript-eslint/no-floating-promises': 'error',
      // Test files: Allow unbound-method for Jest mock assertions (e.g., expect(service.method).toHaveBeenCalled())
      // This prevents false positives in test assertions
      '@typescript-eslint/unbound-method': 'off',
      // Test files: Relax type safety rules for mock objects and test data
      // Mocks and test fixtures often use 'any' types intentionally
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);

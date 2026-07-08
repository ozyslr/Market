import js from '@eslint/js';
import ts from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '**/.venv/**',
      '**/*.cjs',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,

  ...ts.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,

      // Only include stable react-hooks rules (skip v7+ runtime-heavy checks)
      'react-hooks/exhaustive-deps': 'warn',

      // Downgrade noisy rules to warnings (existing codebase debt)
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-self-assign': 'warn',
      'prefer-rest-params': 'warn',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
    settings: {
      react: { version: '19.0' },
    },
  },

  {
    files: ['src/**/*.tsx'],
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },

  firebaseRulesPlugin.configs['flat/recommended'],
];

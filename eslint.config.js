import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Отфильтровываем правила recommended-набора, которых нет в фактически
// установленной версии плагина (бывает в rc/canary сборках) — иначе ESLint
// падает с "Definition for rule ... was not found".
const safeReactHooksRules = Object.fromEntries(
  Object.entries(reactHooks.configs.recommended.rules).filter(
    ([ruleName]) => reactHooks.rules[ruleName.replace('react-hooks/', '')] !== undefined,
  ),
);

export default tseslint.config(
  { ignores: ['dist', '.astro', '.test-build'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...safeReactHooksRules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/shared/evilcharts/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  }
);

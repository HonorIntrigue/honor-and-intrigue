import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import json from '@eslint/json';
import htmlEslint from '@html-eslint/eslint-plugin';
import parser from '@html-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['foundry/**/*']),
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: compat.extends('eslint:recommended'),

    plugins: {
      '@html-eslint': htmlEslint,
      '@jsdoc': jsdoc,
      '@stylistic': stylistic,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'no-undef': 'off',
      'no-unused-vars': 0,

      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
      }],

      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/key-spacing': 'error',
      '@stylistic/keyword-spacing': 2,
      '@stylistic/no-extra-semi': 2,
      '@stylistic/no-multi-spaces': 2,
      '@stylistic/no-whitespace-before-property': 2,
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/semi-spacing': 2,
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 2,
      '@stylistic/space-unary-ops': 2,

      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0,
      }],

      '@stylistic/arrow-spacing': 2,
      '@stylistic/comma-spacing': ['error'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-trailing-spaces': ['error'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/space-before-blocks': 2,

      '@stylistic/no-mixed-operators': ['error', {
        allowSamePrecedence: true,

        groups: [
          ['+', '-', '*', '/', '%', '**'],
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
      }],

      '@jsdoc/require-jsdoc': ['warn', {
        require: { ClassExpression: true, FunctionDeclaration: true, MethodDefinition: true },
        enableFixer: false,
        checkSetters: 'no-getter',
        checkConstructors: false,
      }],
      '@jsdoc/require-description': ['warn', {
        checkConstructors: false,
        contexts: ['FunctionDeclaration', 'ClassDeclaration'],
      }],
      '@jsdoc/require-description-complete-sentence': 'warn',
    },
  },
  {
    files: ['**/*.hbs', '**/*.html'],
    extends: compat.extends('plugin:@html-eslint/recommended'),

    languageOptions: {
      parser: parser,
    },

    rules: {
      '@html-eslint/attrs-newline': ['off', {
        closeStyle: 'sameline',
        ifAttrsMoreThan: 9,
      }],

      '@html-eslint/indent': ['error', 2],
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],

    rules: {
      'sort-keys': ['error', 'desc', { allowLineSeparatedGroups: true }],
    },
  },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],

    plugins: {
      '@stylistic': stylistic,
    },

    rules: {
      '@stylistic/key-spacing': 'error',
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/type-generic-spacing': 'error',
    },
  },
]);

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
export default [{
  files: ['src/**/*.{js,jsx}'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, process: 'readonly' } },
  plugins: { react, 'react-hooks': hooks },
  rules: { ...js.configs.recommended.rules, 'react/jsx-uses-react': 'error', 'react/jsx-uses-vars': 'error', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error', 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }] },
}];

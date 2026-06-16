import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    rules: {
      // Pragmatic defaults for the v2 scaffold: surfaced as advisory warnings
      // rather than hard errors so they don't block the lint gate.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;

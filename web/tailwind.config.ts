import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Colore reale del brand VedoCompro (estratto dal logo legacy e dal theme-color
        // storico del sito, vedi legacy-symfony/web/img/home/logo-vedocompro-cobalt.png e
        // legacy-symfony/app/Resources/views/base.html.twig) — NON il rosso usato finora.
        brand: {
          DEFAULT: '#4396c1',
          dark: '#236abd',
        },
      },
      fontFamily: {
        sans: ['Ubuntu', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

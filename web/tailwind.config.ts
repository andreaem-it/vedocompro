import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#46A3D9',
          dark: '#4396C1',
          light: 'rgba(70,163,217,0.6)',
        },
        footer: {
          bg: '#333333',
          bottom: '#282828',
          text: '#505050',
          hover: '#646464',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Ubuntu', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '5px 5px 10px 0px #BBB',
      },
    },
  },
  plugins: [],
};

export default config;

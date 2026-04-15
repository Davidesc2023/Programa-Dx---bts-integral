import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BTS Integral — dark-mode palette
        primary: {
          DEFAULT: '#4ade80',
          50:  'rgba(74,222,128,0.06)',
          100: 'rgba(74,222,128,0.1)',
          200: 'rgba(74,222,128,0.18)',
          300: '#86efac',
          400: '#4ade80',
          500: '#4ade80',
          600: '#22c55e',
          700: '#16a34a',
          800: '#15803d',
          900: '#14532d',
        },
        accent: {
          DEFAULT: '#facc15',
          50:  'rgba(250,204,21,0.06)',
          100: 'rgba(250,204,21,0.1)',
          200: 'rgba(250,204,21,0.18)',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
        },
        secondary: {
          DEFAULT: '#38bdf8',
          50:  'rgba(56,189,248,0.06)',
          100: 'rgba(56,189,248,0.1)',
          200: 'rgba(56,189,248,0.18)',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;

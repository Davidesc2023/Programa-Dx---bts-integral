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
        // BTS Integral brand tokens — dark palette
        primary: {
          DEFAULT: '#007342',
          50:  'rgba(176,252,206,0.08)',
          100: 'rgba(176,252,206,0.15)',
          200: 'rgba(0,115,66,0.3)',
          300: '#00a35e',
          400: '#007342',
          500: '#007342',
          600: '#005c34',
          700: '#004426',
          800: '#002d19',
          900: '#00160c',
        },
        accent: {
          DEFAULT: '#2BFFF8',
          50:  'rgba(43,255,248,0.08)',
          100: 'rgba(43,255,248,0.15)',
          200: 'rgba(43,255,248,0.3)',
          300: '#80fff9',
          400: '#2BFFF8',
          500: '#00e5de',
        },
        secondary: {
          DEFAULT: '#B0FCCE',
          50:  'rgba(176,252,206,0.05)',
          100: 'rgba(176,252,206,0.1)',
          200: 'rgba(176,252,206,0.2)',
          300: 'rgba(176,252,206,0.5)',
          400: '#B0FCCE',
          500: '#80dba8',
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

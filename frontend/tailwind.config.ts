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
        // BTS Integral brand tokens
        primary: {
          DEFAULT: '#1B7A6B',
          50:  '#E8F5F2',
          100: '#C5E6DF',
          200: '#9DD2CA',
          300: '#71BCB3',
          400: '#44A89E',
          500: '#1B7A6B',
          600: '#166358',
          700: '#104D45',
          800: '#0B3630',
          900: '#051F1B',
        },
        accent: {
          DEFAULT: '#F5C518',
          50:  '#FFFBE6',
          100: '#FEF3B3',
          200: '#FDE97D',
          300: '#FCDF47',
          400: '#F5C518',
          500: '#D4A90C',
        },
        secondary: {
          DEFAULT: '#4490D9',
          50:  '#EBF4FC',
          100: '#C8E1F6',
          200: '#9EC8EE',
          300: '#74ADE6',
          400: '#4490D9',
          500: '#2E76BD',
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

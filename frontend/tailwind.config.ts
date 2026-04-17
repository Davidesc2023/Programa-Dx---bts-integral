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
        // ── BTS Integral — Clinical Light Palette (Material Design 3) ──
        // Primary — teal clínico
        'primary':                    '#006053',
        'primary-container':          '#1B7A6B',
        'on-primary':                 '#ffffff',
        'on-primary-container':       '#b0ffed',
        'primary-fixed':              '#9df2e0',
        'primary-fixed-dim':          '#81d6c4',
        'on-primary-fixed':           '#00201b',
        'on-primary-fixed-variant':   '#005045',
        'inverse-primary':            '#81d6c4',
        // Secondary — azul
        'secondary':                  '#0061a3',
        'secondary-container':        '#6ab2fe',
        'on-secondary':               '#ffffff',
        'on-secondary-container':     '#004474',
        'secondary-fixed':            '#d1e4ff',
        'secondary-fixed-dim':        '#9ecaff',
        'on-secondary-fixed':         '#001d36',
        'on-secondary-fixed-variant': '#00497c',
        // Tertiary — ámbar / dorado
        'tertiary':                   '#745b00',
        'tertiary-container':         '#d0a600',
        'on-tertiary':                '#ffffff',
        'on-tertiary-container':      '#4f3d00',
        'tertiary-fixed':             '#ffe08b',
        'tertiary-fixed-dim':         '#f0c110',
        'on-tertiary-fixed':          '#241a00',
        'on-tertiary-fixed-variant':  '#584400',
        // Error
        'error':                      '#ba1a1a',
        'error-container':            '#ffdad6',
        'on-error':                   '#ffffff',
        'on-error-container':         '#93000a',
        // Surface
        'surface':                    '#f8fafa',
        'surface-dim':                '#d8dada',
        'surface-bright':             '#f8fafa',
        'surface-tint':               '#006b5d',
        'surface-variant':            '#e1e3e3',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f2f4f4',
        'surface-container':          '#eceeee',
        'surface-container-high':     '#e6e8e9',
        'surface-container-highest':  '#e1e3e3',
        'on-surface':                 '#191c1d',
        'on-surface-variant':         '#3e4946',
        'inverse-surface':            '#2e3131',
        'inverse-on-surface':         '#eff1f1',
        // Background
        'background':                 '#f8fafa',
        'on-background':              '#191c1d',
        // Outline
        'outline':                    '#6e7976',
        'outline-variant':            '#bec9c5',
        // Accent legacy alias
        'accent':                     '#F5C518',
      },
      fontFamily: {
        sans:     ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        'clinical':    '0px 8px 24px rgba(25, 28, 29, 0.06)',
        'clinical-lg': '0px 16px 40px rgba(25, 28, 29, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;

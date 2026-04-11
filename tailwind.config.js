/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        sage:         '#4A7C59',
        'sage-light': '#EBF2ED',
        'sage-mid':   '#C5DBC9',
        ink:          '#0F1117',
        'ink-mid':    '#3D4151',
        'ink-light':  '#6B7280',
        ghost:        '#F7F7F5',
        border:       '#E8E8E4',
        amber:        '#D97706',
        'amber-light':'#FEF3C7',
        red:          '#DC2626',
        'red-light':  '#FEE2E2',
        blue:         '#2563EB',
        'blue-light': '#EFF6FF',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,17,23,0.04)',
        md: '0 6px 24px rgba(15,17,23,0.07)',
        lg: '0 24px 80px rgba(15,17,23,0.18)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      height: {
        header: 'var(--header-height)',
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          50: '#F6E1C9',
          100: '#F6E1C9',
          200: '#DBBDBE',
          300: '#DBBDBE',
          400: '#878D87',
          500: '#85708F',
          600: '#564B60',
          700: '#564B60',
          800: '#564B60',
          900: '#564B60',
          950: '#564B60',
        },
        accent: {
          light: '#F6E1C9',
          pink: '#DBBDBE',
          purple: '#85708F',
          dark: '#564B60',
          gray: '#878D87',
        },
      },
    },
  },
  plugins: [],
}
export default config


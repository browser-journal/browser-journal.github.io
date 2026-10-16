/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editorial: {
          lightBg: '#FAF8F5',
          lightSurface: '#FFFFFF',
          ink: '#1C1917',
          darkBg: '#0C0A09',
          darkSurface: '#1C1917',
          darkCard: '#181615',
          borderLight: '#E7E5E4',
          borderDark: '#292524',
          mutedLight: '#78716C',
          mutedDark: '#A8A29E',
        },
        brand: {
          DEFAULT: 'var(--brand-primary, #95E1D3)',
          hover: 'var(--brand-primary-hover, #78CBBF)',
          light: 'var(--brand-primary-light, #EAFFD0)',
          dark: 'var(--brand-primary-dark, #2A7B6F)',
          accent: 'var(--brand-accent, #F38181)',
          accentHover: 'var(--brand-accent-hover, #E46F6F)',
          accentLight: 'var(--brand-accent-light, #FCE38A)',
          coral: '#F38181',
          honey: '#FCE38A',
          meadow: '#EAFFD0',
          seafoam: '#95E1D3',
        },
      },
      fontFamily: {
        serif: ['var(--font-journal, "Playfair Display", Georgia, Cambria, "Times New Roman", serif)'],
        sans: ['var(--font-journal-sans, "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'],
        mono: ['var(--font-journal-mono, "JetBrains Mono", Menlo, Monaco, Consolas, monospace)'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 4px 20px -2px rgba(28, 25, 23, 0.05)',
        cardDark: '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        elevation: '0 12px 32px -4px rgba(28, 25, 23, 0.08)',
      },
    },
  },
  plugins: [],
};

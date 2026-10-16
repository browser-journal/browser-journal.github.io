import type { ThemeConfig } from '../types/journal';

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  primaryHover: string;
  primaryLight: string;
  accentColor: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'pastel-aesthetic',
    name: 'Pastel Aesthetic',
    primaryColor: '#95E1D3',
    primaryHover: '#78CBBF',
    primaryLight: '#EAFFD0',
    accentColor: '#F38181',
    description: 'Enchanting aesthetic harmony: Seafoam Aqua (#95E1D3), Coral Rose (#F38181), Meadow Mint (#EAFFD0), and Honey Yellow (#FCE38A).',
  },
  {
    id: 'sage',
    name: 'Warm Sage',
    primaryColor: '#0F766E',
    primaryHover: '#0D655E',
    primaryLight: '#E6F4F1',
    accentColor: '#D97706',
    description: 'Calm editorial teal inspired by tea and antique paper.',
  },
  {
    id: 'terracotta',
    name: 'Terracotta Linen',
    primaryColor: '#C2410C',
    primaryHover: '#9A3412',
    primaryLight: '#FFEDD5',
    accentColor: '#D97706',
    description: 'Earthy Tuscan clay with warm Mediterranean sunlight.',
  },
  {
    id: 'rosewood',
    name: 'Rosewood Blush',
    primaryColor: '#9F1239',
    primaryHover: '#881337',
    primaryLight: '#FFE4E6',
    accentColor: '#E11D48',
    description: 'Romantic vintage velvet and dried botanical rose petals.',
  },
  {
    id: 'indigo',
    name: 'Midnight Indigo',
    primaryColor: '#4338CA',
    primaryHover: '#3730A3',
    primaryLight: '#E0E7FF',
    accentColor: '#0284C7',
    description: 'Deep nocturnal blue for introspective late night writing.',
  },
  {
    id: 'forest',
    name: 'Pine & Moss',
    primaryColor: '#15803D',
    primaryHover: '#166534',
    primaryLight: '#DCFCE7',
    accentColor: '#65A30D',
    description: 'Quiet woodland cedar and rejuvenating evergreen foliage.',
  },
  {
    id: 'charcoal',
    name: 'Charcoal Minimal',
    primaryColor: '#334155',
    primaryHover: '#1E293B',
    primaryLight: '#F1F5F9',
    accentColor: '#64748B',
    description: 'Timeless monochrome ink for pure Scandinavian minimalism.',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    primaryColor: '#B45309',
    primaryHover: '#92400E',
    primaryLight: '#FEF3C7',
    accentColor: '#F59E0B',
    description: 'Warm candlelight glow and aged parchment warmth.',
  },
  {
    id: 'lavender',
    name: 'Lavender Calm',
    primaryColor: '#7E22CE',
    primaryHover: '#6B21A8',
    primaryLight: '#F3E8FF',
    accentColor: '#A855F7',
    description: 'Soothing violet and calming aromatic French lavender.',
  },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  presetId: 'pastel-aesthetic',
  primaryColor: '#95E1D3',
  primaryHover: '#78CBBF',
  primaryLight: '#EAFFD0',
  accentColor: '#F38181',
  fontFamily: 'serif',
  fontSize: 'base',
  lineHeight: 'relaxed',
};

const THEME_STORAGE_KEY = 'daily_diary_custom_theme_v1';
const DARK_MODE_STORAGE_KEY = 'daily_diary_dark_mode';

/**
 * Calculates a slightly darker shade for hover states given a hex color.
 */
export function adjustHexColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Applies CSS variables and font configuration dynamically to the document root.
 */
export function applyThemeConfig(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', config.primaryColor);
  root.style.setProperty('--brand-primary-hover', config.primaryHover || adjustHexColor(config.primaryColor, -15));
  root.style.setProperty('--brand-primary-light', config.primaryLight || '#EAFFD0');
  root.style.setProperty('--brand-accent', config.accentColor);
  root.style.setProperty('--brand-accent-hover', adjustHexColor(config.accentColor, -15));
  root.style.setProperty('--brand-coral', '#F38181');
  root.style.setProperty('--brand-yellow', '#FCE38A');
  root.style.setProperty('--brand-mint', '#EAFFD0');
  root.style.setProperty('--brand-seafoam', '#95E1D3');

  // Font family
  if (config.fontFamily === 'serif') {
    root.style.setProperty('--font-journal', '"Playfair Display", Georgia, Cambria, serif');
  } else if (config.fontFamily === 'mono') {
    root.style.setProperty('--font-journal', '"JetBrains Mono", Menlo, Consolas, monospace');
  } else {
    root.style.setProperty('--font-journal', '"Plus Jakarta Sans", system-ui, sans-serif');
  }
}

/**
 * Loads user theme settings from localStorage or defaults.
 */
export function loadStoredThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_THEME_CONFIG;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatically migrate legacy 'sage' or unconfigured theme to the new aesthetic palette
      if (!parsed.presetId || parsed.presetId === 'sage') {
        saveThemeConfig(DEFAULT_THEME_CONFIG);
        return DEFAULT_THEME_CONFIG;
      }
      return { ...DEFAULT_THEME_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error loading theme config:', e);
  }
  return DEFAULT_THEME_CONFIG;
}

/**
 * Persists user theme configuration to localStorage and applies it.
 */
export function saveThemeConfig(config: ThemeConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    applyThemeConfig(config);
  } catch (e) {
    console.error('Error saving theme config:', e);
  }
}

/**
 * Manages dark mode class on document.documentElement.
 */
export function initDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved !== null ? saved === 'true' : prefersDark;

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return isDark;
  } catch (e) {
    return false;
  }
}

export function setDarkMode(isDark: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.error('Error toggling dark mode:', e);
  }
}

export interface CoverPreset {
  id: string;
  name: string;
  category: string;
  previewGradient: string;
  backgroundStyle: string; // CSS background style (gradient, pattern, or svg)
  textColor: string;
  accentBorder: string;
  description: string;
}

export interface CoverConfig {
  presetId: string;
  customImageUrl?: string;
  title: string;
  subtitle: string;
  monogram?: string;
  textureEffect: 'smooth' | 'leather' | 'linen' | 'gold-trim';
}

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'pastel-meadow',
    name: 'Pastel Meadow Harmony',
    category: 'Aesthetic',
    previewGradient: 'linear-gradient(135deg, #F38181 0%, #FCE38A 35%, #EAFFD0 70%, #95E1D3 100%)',
    backgroundStyle: 'linear-gradient(135deg, #F38181 0%, #FCE38A 35%, #EAFFD0 70%, #95E1D3 100%)',
    textColor: '#1C1917',
    accentBorder: 'rgba(28, 25, 23, 0.25)',
    description: 'Enchanting sunset watercolor blend of Coral, Honey, Meadow, and Seafoam.',
  },
  {
    id: 'vintage-leather',
    name: 'Antique Tuscan Leather',
    category: 'Classic',
    previewGradient: 'linear-gradient(135deg, #5C2C16 0%, #3B1B0D 100%)',
    backgroundStyle: 'radial-gradient(ellipse at center, #6A351C 0%, #3A1B0C 100%)',
    textColor: '#FDF6E2',
    accentBorder: 'rgba(245, 197, 85, 0.45)',
    description: 'Classic Florentine bound leather with warm golden border stitching.',
  },
  {
    id: 'midnight-celestial',
    name: 'Midnight Celestial & Stars',
    category: 'Mystical',
    previewGradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #311042 100%)',
    backgroundStyle: 'radial-gradient(circle at top right, #312E81 0%, #0F172A 70%, #030712 100%)',
    textColor: '#FEF08A',
    accentBorder: 'rgba(254, 240, 138, 0.4)',
    description: 'Deep starlit nocturnal indigo with shimmering celestial foil.',
  },
  {
    id: 'wildflower-botanical',
    name: 'Pressed Wildflowers & Linen',
    category: 'Botanical',
    previewGradient: 'linear-gradient(135deg, #EFECE6 0%, #D8D2C2 100%)',
    backgroundStyle: 'linear-gradient(135deg, #FAF7F2 0%, #EDE7DD 100%)',
    textColor: '#2E3A24',
    accentBorder: 'rgba(46, 58, 36, 0.3)',
    description: 'Natural organic paper textured with dried herbal flora and botanical simplicity.',
  },
  {
    id: 'cherry-blossom',
    name: 'Kyoto Sakura Blossom',
    category: 'Botanical',
    previewGradient: 'linear-gradient(135deg, #FBCFE8 0%, #FDA4AF 50%, #FECDD3 100%)',
    backgroundStyle: 'linear-gradient(135deg, #FFF1F2 0%, #FCE7F3 50%, #FEE2E2 100%)',
    textColor: '#831843',
    accentBorder: 'rgba(190, 24, 93, 0.35)',
    description: 'Delicate spring sakura blossoms drifting over textured handmade washi.',
  },
  {
    id: 'sage-linen',
    name: 'Nordic Sage Linen',
    category: 'Minimalist',
    previewGradient: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
    backgroundStyle: 'linear-gradient(135deg, #134E48 0%, #042F2E 100%)',
    textColor: '#CCFBF1',
    accentBorder: 'rgba(204, 251, 241, 0.35)',
    description: 'Calm Scandinavian woven green cloth with minimal gold leaf monogram.',
  },
  {
    id: 'obsidian-marble',
    name: 'Obsidian & Gold Vein',
    category: 'Luxury',
    previewGradient: 'linear-gradient(135deg, #18181B 0%, #09090B 100%)',
    backgroundStyle: 'linear-gradient(135deg, #27272A 0%, #09090B 100%)',
    textColor: '#FDE047',
    accentBorder: 'rgba(253, 224, 71, 0.4)',
    description: 'Ultra-luxurious dark midnight stone with luminous veins of crushed gold.',
  },
  {
    id: 'sunset-terracotta',
    name: 'Terracotta Velvet',
    category: 'Warm',
    previewGradient: 'linear-gradient(135deg, #EA580C 0%, #9A3412 100%)',
    backgroundStyle: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)',
    textColor: '#FFEDD5',
    accentBorder: 'rgba(255, 237, 213, 0.35)',
    description: 'Warm Mediterranean clay bathed in late afternoon golden-hour light.',
  },
];

export const DEFAULT_COVER_CONFIG: CoverConfig = {
  presetId: 'pastel-meadow',
  title: 'My Daily Diary',
  subtitle: '100% Private Browser Journal',
  monogram: 'D',
  textureEffect: 'gold-trim',
};

const COVER_STORAGE_KEY = 'daily_diary_cover_config_v1';

export function loadStoredCoverConfig(): CoverConfig {
  if (typeof window === 'undefined') return DEFAULT_COVER_CONFIG;
  try {
    const raw = localStorage.getItem(COVER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COVER_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error loading cover config:', e);
  }
  return DEFAULT_COVER_CONFIG;
}

export function saveCoverConfig(config: CoverConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COVER_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving cover config:', e);
  }
}

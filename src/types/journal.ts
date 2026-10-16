export type MoodType =
  | 'calm'
  | 'focused'
  | 'grateful'
  | 'happy'
  | 'tired'
  | 'energized'
  | 'reflective'
  | 'inspired';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood?: MoodType;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  promptUsed?: string;
}

export interface DayJournalGroup {
  date: string;
  entries: JournalEntry[];
}

export type FontFamilyChoice = 'serif' | 'sans' | 'mono';
export type FontSizeChoice = 'sm' | 'base' | 'lg';

export interface ThemeConfig {
  presetId: string;
  primaryColor: string;
  primaryHover: string;
  primaryLight: string;
  accentColor: string;
  fontFamily: FontFamilyChoice;
  fontSize: FontSizeChoice;
  lineHeight: 'normal' | 'relaxed' | 'loose';
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  totalWords: number;
  activeDates: Set<string> | string[];
}

export interface SupportedLanguage {
  code: string;
  badge: string;
  label: string;
  dir?: 'ltr' | 'rtl';
}

export interface LocalizedDictionary {
  meta: {
    title: string;
    description: string;
    keywords: string;
    url: string;
    h1Title?: string;
    h1Subtitle?: string;
  };
  nav: {
    brand: string;
    tagline: string;
    trustBadge: string;
    lightMode: string;
    darkMode: string;
    themeCustomizer: string;
    supportDev: string;
    zenMode: string;
    zenExit: string;
    pinLock: string;
    backupRestore: string;
    newEntry: string;
  };
  editor: {
    datePlaceholder: string;
    titlePlaceholder: string;
    contentPlaceholder: string;
    saving: string;
    saved: string;
    unsaved: string;
    words: string;
    characters: string;
    readingTime: string;
    readMin: string;
    inspireMe: string;
    usePrompt: string;
    nextPrompt: string;
    deleteEntry: string;
    confirmDelete: string;
    exportMarkdown: string;
    exportText: string;
    exportPrint: string;
  };
  moods: {
    title: string;
    calm: string;
    focused: string;
    grateful: string;
    happy: string;
    tired: string;
    energized: string;
    reflective: string;
    inspired: string;
  };
  prompts: string[];
  sidebar: {
    today: string;
    searchPlaceholder: string;
    noResults: string;
    streakTitle: string;
    streakDays: string;
    bestStreak: string;
    totalNotes: string;
    recentEntries: string;
    allEntries: string;
    filterByMood: string;
    jumpToDate: string;
    emptyJournalNotice: string;
  };
  pin: {
    title: string;
    subtitle: string;
    setupTitle: string;
    setupSubtitle: string;
    enterPin: string;
    confirmPin: string;
    wrongPin: string;
    pinMismatch: string;
    unlock: string;
    enableLock: string;
    disableLock: string;
    lockNow: string;
    securityNote: string;
    cancel: string;
  };
  exportModal: {
    title: string;
    subtitle: string;
    backupJson: string;
    backupJsonDesc: string;
    restoreJson: string;
    restoreJsonDesc: string;
    restoreSuccess: string;
    restoreError: string;
    exportCurrent: string;
    close: string;
  };
  themeModal: {
    title: string;
    subtitle: string;
    presets: string;
    customColors: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    fontFamily: string;
    fontSerif: string;
    fontSans: string;
    fontMono: string;
    fontSize: string;
    sizeSm: string;
    sizeBase: string;
    sizeLg: string;
    resetDefaults: string;
    close: string;
  };
  seoContent: {
    heroTitle: string;
    heroSubtitle: string;
    featuresHeading: string;
    features: {
      title: string;
      description: string;
    }[];
    faqHeading: string;
    faqs: {
      q: string;
      a: string;
    }[];
  };
}

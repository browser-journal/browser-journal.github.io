import type { LocalizedDictionary, SupportedLanguage } from '../types/journal';
import { en } from './locales/en';
import { es } from './locales/es';
import { pt } from './locales/pt';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { ja } from './locales/ja';
import { zh } from './locales/zh';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', badge: 'US', label: 'English' },
  { code: 'es', badge: 'ES', label: 'Español' },
  { code: 'pt', badge: 'BR', label: 'Português' },
  { code: 'de', badge: 'DE', label: 'Deutsch' },
  { code: 'fr', badge: 'FR', label: 'Français' },
  { code: 'ja', badge: 'JP', label: '日本語' },
  { code: 'zh', badge: 'CN', label: '简体中文' },
];

export const DEFAULT_LANGUAGE = 'en';

const dictionaries: Record<string, LocalizedDictionary> = {
  en,
  es,
  pt,
  de,
  fr,
  ja,
  zh,
};

export function getDictionary(locale?: string): LocalizedDictionary {
  if (locale && dictionaries[locale]) {
    return dictionaries[locale];
  }
  return dictionaries[DEFAULT_LANGUAGE];
}

export function isValidLocale(locale: string): boolean {
  return Boolean(dictionaries[locale]);
}

export function getLanguagePath(code: string): string {
  if (code === DEFAULT_LANGUAGE) {
    return '/';
  }
  return `/${code}`;
}

import type { JournalEntry, StreakStats, MoodType } from '../types/journal';
import {
  encryptData,
  decryptData,
  setupPinSecurity,
  verifyUserPin,
} from './crypto';
import { getLocalTodayStr, shiftDateStr } from './date';
import { htmlToMarkdown, htmlToPlainText } from './htmlMarkdown';

const STORAGE_KEY_ENTRIES = 'daily_diary_entries_v1';
const STORAGE_KEY_SECURITY = 'daily_diary_pin_security_v1';

export interface PinSecurityMeta {
  isEnabled: boolean;
  salt?: string;
  iv?: string;
  verificationCipher?: string;
}

/**
 * Returns initial welcoming sample entries if user is visiting for the first time.
 */
export function getWelcomeEntry(locale = 'en'): JournalEntry {
  const today = getLocalTodayStr();
  
  const welcomeContentMap: Record<string, { title: string; content: string; mood: MoodType }> = {
    es: {
      title: 'Bienvenido a DailyDiary — Tu Santuario Privado',
      content: `Hoy comienza un ritual sereno y diario.\n\nTodo lo que escribes en DailyDiary permanece 100% en tu navegador web. Sin servidores en la nube, sin rastreadores, sin cuentas y sin entrenamiento de inteligencia artificial con tus pensamientos íntimos.\n\n• 🛡️ **Privacidad sin Servidores**: Tus palabras se guardan directamente en la memoria de tu dispositivo.\n• 🔐 **Bloqueo PIN AES-GCM Opcional**: Cifra tus notas con criptografía militar directamente en el navegador.\n• 🎨 **Paletas de Color Configurables**: Personaliza los tonos y fuentes tipográficas según tu estilo desde el botón Palette.\n• 🧘 **Modo Enfoque Zen**: Activa el modo Zen para escribir con serenidad absoluta sin distracciones.\n• 📦 **Soberanía de Datos**: Exporta en Markdown, texto plano o copias completas JSON en cualquier instante.\n\nRespira profundamente, selecciona tu estado de ánimo arriba y deja fluir tus pensamientos.`,
      mood: 'calm',
    },
    pt: {
      title: 'Bem-vindo ao DailyDiary — Seu Santuário Privado',
      content: `Hoje se inicia um ritual tranquilo de autorreflexão.\n\nTudo o que você escreve no DailyDiary permanece 100% no seu próprio navegador. Sem servidores na nuvem, sem rastreadores, sem logins e sem inteligência artificial lendo suas memórias.\n\n• 🛡️ **Privacidade sem Servidores**: Seus textos são gravados diretamente na memória do seu dispositivo.\n• 🔐 **Bloqueio com PIN AES-GCM**: Criptografe suas anotações com segurança militar client-side.\n• 🎨 **Paletas de Cores no Navegador**: Ajuste cores e fontes clássicas ao seu gosto pelo ícone Palette.\n• 🧘 **Modo Foco Zen**: Oculte todas as barras para uma experiência pura de escrita.\n• 📦 **Controle Total**: Baixe em Markdown (.md), texto ou faça backups universais em JSON quando desejar.\n\nRespire fundo, marque seu humor no topo e deixe as palavras fluírem.`,
      mood: 'calm',
    },
    de: {
      title: 'Willkommen bei DailyDiary — Dein privater Rückzugsort',
      content: `Heute beginnt ein achtsames, tägliches Schreibritual.\n\nAlles, was du in DailyDiary schreibst, verbleibt zu 100% in deinem Browser. Keine Cloud-Server, keine Tracker, keine Konten und kein Auslesen deiner Gedanken.\n\n• 🛡️ **Privatsphäre ohne Server**: Deine Aufzeichnungen verbleiben im internen Speicher deines Geräts.\n• 🔐 **Optionale AES-GCM PIN-Sperre**: Schütze deine Notizen mit 256-Bit-Verschlüsselung im Browser.\n• 🎨 **Einstellbare Farbpalette**: Wähle dein Wunschdesign und Schriftarten über das Palette-Menü.\n• 🧘 **Zen-Fokus-Modus**: Blende alle Ablenkungen aus für ungestörte Konzentration beim Schreiben.\n• 📦 **Echte Datenhoheit**: Sichere deine Notizen jederzeit als Markdown, Textdatei oder JSON-Backup.\n\nAtme tief ein, wähle deine Tagesstimmung und beginne deinen ersten Eintrag.`,
      mood: 'calm',
    },
    fr: {
      title: 'Bienvenue sur DailyDiary — Votre Sanctuaire Privé',
      content: `Aujourd’hui débute un rituel quotidien apaisant.\n\nTout ce que vous écrivez dans DailyDiary reste stocké à 100% dans votre navigateur web. Aucun serveur distant, aucun traqueur publicitaire, aucun compte requis.\n\n• 🛡️ **Zéro Serveur**: Vos mots restent protégés dans la mémoire locale de votre appareil.\n• 🔐 **Verrouillage PIN AES-GCM**: Chiffrez vos réflexions avec la robustesse de l’algorithme 256 bits.\n• 🎨 **Palettes Personnalisables**: Configurez l’atmosphère visuelle et la typographie avec le menu Palette.\n• 🧘 **Mode Focus Zen**: Isolez-vous des distractions pour une écriture fluide et sereine.\n• 📦 **Souveraineté des Données**: Téléchargez en Markdown (.md), texte brut ou sauvegarde complète JSON.\n\nPrenez une profonde inspiration, indiquez votre humeur du jour et laissez vos pensées éclore.`,
      mood: 'calm',
    },
    ja: {
      title: 'DailyDiary へようこそ — あなただけの静寂な内省空間',
      content: `今日から、穏やかな毎日の内省の習慣が始まります。\n\nDailyDiary に綴られたすべての記録は、100% あなたのブラウザ内だけに保存されます。クラウドサーバーへの送信、トラッカー、アカウント登録、AIによる文章の学習は一切ありません。\n\n• 🛡️ **サーバー不要の完全プライベート**: 書いた言葉は端末のブラウザ内ストレージにのみ保存されます。\n• 🔐 **AES-GCM 256bit PINロック**: 共用パソコンでも安心の軍用規格暗号化を適用可能。\n• 🎨 **ブラウザで選べるカラーパレット**: 画面上の Palette ボタンからお好みの配色やフォントに即座に調整できます。\n• 🧘 **Zen 集中モード**: 余計な表示を隠し、思考とタイピングに没頭できます。\n• 📦 **自由なデータ保存**: Markdown (.md)、テキスト、JSON バックアップをいつでも書き出せます。\n\n深呼吸をして、上の気分アイコンを選び、心に浮かぶ思いをそのまま書き留めてみましょう。`,
      mood: 'calm',
    },
    zh: {
      title: '欢迎使用 DailyDiary — 属于你的绝对隐私心灵避风港',
      content: `今天是一个专注内省、记录生活的新起点。\n\n你在 DailyDiary 中写下的每一个字，都 100% 仅保存在你当前设备的浏览器本地。没有云端数据库、没有账号密码注册、没有行为跟踪，绝不会用于任何 AI 模型的抓取与训练。\n\n• 🛡️ **零服务器纯本地隐私**: 所有日记只存放在浏览器内部，离线亦可随时书写。\n• 🔐 **原生 AES-GCM 密码加密锁**: 采用 Web Crypto API 256 位军事级加密，保护你的私密记录。\n• 🎨 **浏览器端可配置调色盘**: 点击顶部的 Palette 按钮，自由切换多种精美色系与经典字体。\n• 🧘 **Zen 专注模式**: 一键隐藏侧边栏与辅助按键，沉浸于行云流水般的书写体验。\n• 📦 **数据资产完全归你所有**: 支持随时一键导出 Markdown (.md)、纯文本或全量 JSON 备份。\n\n深呼吸，在上方选择你今日的心情，让思绪从容流淌。`,
      mood: 'calm',
    },
  };

  const selected = welcomeContentMap[locale] || {
    title: 'Welcome to DailyDiary — Your Private Sanctuary',
    content: `Today is the beginning of a quiet daily ritual.\n\nEverything you write in DailyDiary remains 100% inside your web browser. No cloud databases, no trackers, no accounts, and no AI training on your private thoughts.\n\nHere are a few thoughtful features crafted for you:\n\n• 🛡️ **Zero-Server Privacy**: Your words are saved directly to your device's browser memory.\n• 🔐 **Optional AES-GCM PIN Lock**: Encrypt your thoughts with military-grade client-side cryptography.\n• 🎨 **Custom Color Palettes**: Tailor the theme colors and fonts to your personal aesthetic using the palette icon above.\n• 🧘 **Zen Focus Mode**: Press Zen Mode to hide all distractions and immerse yourself in the flow of writing.\n• 📦 **Complete Data Ownership**: Export your words as clean Markdown, plain text, or full JSON backups at any moment.\n\nTake a deep breath, choose your mood above, and let your thoughts unfold.`,
    mood: 'calm' as MoodType,
  };

  return {
    id: 'welcome-entry-intro',
    date: today,
    title: selected.title,
    content: selected.content,
    mood: selected.mood,
    tags: ['welcome', 'mindset', 'privacy'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Loads PIN lock metadata from localStorage.
 */
export function getPinSecurityMeta(): PinSecurityMeta {
  if (typeof window === 'undefined') return { isEnabled: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SECURITY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.salt && data.verificationCipher && data.iv) {
        return { isEnabled: true, ...data };
      }
    }
  } catch (e) {
    console.error('Error reading pin security meta:', e);
  }
  return { isEnabled: false };
}

/**
 * Enables PIN lock with Web Crypto AES-GCM encryption.
 */
export async function enablePinLock(pin: string, existingEntries: JournalEntry[]): Promise<CryptoKey> {
  const security = await setupPinSecurity(pin);
  const meta: PinSecurityMeta = {
    isEnabled: true,
    salt: security.salt,
    iv: security.iv,
    verificationCipher: security.verificationCipher,
  };

  localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(meta));

  // Re-save all existing entries encrypted with this key
  await saveAllEntriesEncrypted(existingEntries, security.key);

  return security.key;
}

/**
 * Disables PIN lock and decrypts all stored entries back to plain JSON in localStorage.
 */
export async function disablePinLock(currentEntries: JournalEntry[]): Promise<void> {
  localStorage.removeItem(STORAGE_KEY_SECURITY);
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(currentEntries));
}

/**
 * Verifies a user entered PIN. Returns CryptoKey on success, null on failure.
 */
export async function verifyPin(pin: string): Promise<CryptoKey | null> {
  const meta = getPinSecurityMeta();
  if (!meta.isEnabled || !meta.salt || !meta.iv || !meta.verificationCipher) {
    return null;
  }
  return verifyUserPin(pin, meta.salt, meta.iv, meta.verificationCipher);
}

/**
 * Encrypts and writes all entries to localStorage.
 */
async function saveAllEntriesEncrypted(entries: JournalEntry[], key: CryptoKey): Promise<void> {
  const serialized = JSON.stringify(entries);
  const encrypted = await encryptData(serialized, key);
  localStorage.setItem(
    STORAGE_KEY_ENTRIES,
    JSON.stringify({
      isEncrypted: true,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    })
  );
}

/**
 * Loads all journal entries, decrypting if necessary.
 */
export async function loadEntries(key?: CryptoKey | null, locale = 'en'): Promise<JournalEntry[]> {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) {
      // First time initialization
      const sample = [getWelcomeEntry(locale)];
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(sample));
      return sample;
    }

    const parsed = JSON.parse(raw);

    // If data is encrypted
    if (parsed && parsed.isEncrypted) {
      if (!key) {
        // Data is locked; requires PIN verification to decrypt
        return [];
      }
      const decryptedJson = await decryptData(parsed.ciphertext, parsed.iv, key);
      return JSON.parse(decryptedJson);
    }

    // Unencrypted standard array
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Error loading journal entries:', err);
  }

  return [];
}

/**
 * Saves or updates a journal entry in storage.
 */
export async function saveEntry(
  entry: JournalEntry,
  key?: CryptoKey | null
): Promise<JournalEntry[]> {
  const entries = await loadEntries(key);
  const existingIdx = entries.findIndex((e) => e.id === entry.id);

  let updatedList: JournalEntry[];
  if (existingIdx >= 0) {
    updatedList = [...entries];
    updatedList[existingIdx] = {
      ...entry,
      updatedAt: Date.now(),
    };
  } else {
    updatedList = [
      {
        ...entry,
        createdAt: entry.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      ...entries,
    ];
  }

  // Sort by date descending then updatedAt descending
  updatedList.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.updatedAt - a.updatedAt;
  });

  const sec = getPinSecurityMeta();
  if (sec.isEnabled && key) {
    await saveAllEntriesEncrypted(updatedList, key);
  } else {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedList));
  }

  return updatedList;
}

/**
 * Deletes a journal entry by ID.
 */
export async function deleteEntry(
  entryId: string,
  key?: CryptoKey | null
): Promise<JournalEntry[]> {
  const entries = await loadEntries(key);
  const updatedList = entries.filter((e) => e.id !== entryId);

  const sec = getPinSecurityMeta();
  if (sec.isEnabled && key) {
    await saveAllEntriesEncrypted(updatedList, key);
  } else {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedList));
  }

  return updatedList;
}

/**
 * Calculates current streak, best streak, and word stats.
 */
export function calculateStreakStats(entries: JournalEntry[]): StreakStats {
  if (!entries || entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      totalWords: 0,
      activeDates: [],
    };
  }

  const dateSet = new Set<string>();
  let totalWords = 0;

  for (const entry of entries) {
    if (entry.content && entry.content.trim().length > 0) {
      dateSet.add(entry.date);
      const words = entry.content.trim().split(/\s+/).filter(Boolean).length;
      totalWords += words;
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  const activeDates = sortedDates;

  // Calculate current streak
  const todayStr = getLocalTodayStr();
  const yesterdayStr = shiftDateStr(todayStr, -1);

  let currentStreak = 0;
  let checkDateStr = dateSet.has(todayStr) ? todayStr : dateSet.has(yesterdayStr) ? yesterdayStr : null;

  if (checkDateStr) {
    let curStr = checkDateStr;
    while (dateSet.has(curStr)) {
      currentStreak++;
      curStr = shiftDateStr(curStr, -1);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = d;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalEntries: entries.length,
    totalWords,
    activeDates,
  };
}

/**
 * Downloads a text file in browser.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports single entry to Markdown (.md).
 */
export function exportEntryToMarkdown(entry: JournalEntry): void {
  const tagsStr = entry.tags && entry.tags.length > 0 ? `\nTags: ${entry.tags.join(', ')}` : '';
  const moodStr = entry.mood ? `\nMood: ${entry.mood}` : '';
  const promptStr = entry.promptUsed ? `\nPrompt: "${entry.promptUsed}"\n` : '';
  const bodyMarkdown = htmlToMarkdown(entry.content);

  const md = `# ${entry.title || 'Journal Entry'}\n**Date:** ${entry.date}${moodStr}${tagsStr}\n${promptStr}\n---\n\n${bodyMarkdown}`;
  const filename = `daily-diary-${entry.date}-${entry.title ? entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'entry'}.md`;
  downloadFile(md, filename, 'text/markdown;charset=utf-8');
}

/**
 * Exports single entry to plain text (.txt).
 */
export function exportEntryToPlainText(entry: JournalEntry): void {
  const bodyTxt = htmlToPlainText(entry.content);
  const txt = `${entry.title || 'Journal Entry'}\nDate: ${entry.date}\nMood: ${entry.mood || 'None'}\n\n${bodyTxt}`;
  const filename = `daily-diary-${entry.date}.txt`;
  downloadFile(txt, filename, 'text/plain;charset=utf-8');
}

/**
 * Backups all entries to JSON.
 */
export function backupAllDataToJson(entries: JournalEntry[]): void {
  const backupObject = {
    app: 'DailyDiary',
    version: '1.0.0',
    exportTimestamp: Date.now(),
    exportDateISO: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries,
  };
  const jsonStr = JSON.stringify(backupObject, null, 2);
  const filename = `daily-diary-backup-${getLocalTodayStr()}.json`;
  downloadFile(jsonStr, filename, 'application/json;charset=utf-8');
}

/**
 * Restores entries from uploaded JSON file.
 */
export async function restoreFromJsonFile(file: File): Promise<JournalEntry[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && Array.isArray(parsed.entries)) {
    rawList = parsed.entries;
  } else {
    throw new Error('Invalid DailyDiary backup file format.');
  }

  const validEntries: JournalEntry[] = rawList
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      id: item.id || `restored-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      title: item.title || 'Restored Entry',
      content: item.content || '',
      mood: item.mood || undefined,
      tags: Array.isArray(item.tags) ? item.tags : [],
      createdAt: Number(item.createdAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Date.now(),
      promptUsed: item.promptUsed || undefined,
    }));

  return validEntries;
}

/**
 * Opens print preview for current entry.
 */
export function printCurrentEntry(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Bold,
  Italic,
  Underline,
  Heading,
  Quote,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Lock,
  Maximize2,
  Minimize2,
  Palette,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  X,
  FileText,
  FileCode,
  Calendar,
  Check,
  AlignLeft,
  Smile,
  Book,
  BookOpen,
  Image as ImageIcon,
  Copy,
} from 'lucide-react';
import type {
  JournalEntry,
  LocalizedDictionary,
  MoodType,
  ThemeConfig,
  FontFamilyChoice,
  FontSizeChoice,
} from '../types/journal';
import {
  loadEntries,
  saveEntry,
  deleteEntry,
  calculateStreakStats,
  exportEntryToMarkdown,
  exportEntryToPlainText,
  backupAllDataToJson,
  restoreFromJsonFile,
  printCurrentEntry,
  getPinSecurityMeta,
  enablePinLock,
  disablePinLock,
  verifyPin,
} from '../utils/JournalStorage';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
  loadStoredThemeConfig,
  saveThemeConfig,
  adjustHexColor,
} from '../utils/theme';
import type { CoverConfig } from '../utils/cover';
import {
  COVER_PRESETS,
  loadStoredCoverConfig,
  saveCoverConfig,
} from '../utils/cover';
import { EMOJI_CATEGORIES } from '../utils/emojis';
import {
  getLocalTodayStr,
  shiftDateStr,
  formatDisplayDate,
  isTodayStr,
} from '../utils/date';
import { htmlToPlainText } from '../utils/htmlMarkdown';

interface JournalAppProps {
  currentLocale: string;
  dict: LocalizedDictionary;
}

const MOOD_ITEMS: { id: MoodType; emoji: string; key: keyof LocalizedDictionary['moods'] }[] = [
  { id: 'calm', emoji: '🌿', key: 'calm' },
  { id: 'focused', emoji: '🎯', key: 'focused' },
  { id: 'grateful', emoji: '🙏', key: 'grateful' },
  { id: 'happy', emoji: '✨', key: 'happy' },
  { id: 'tired', emoji: '🌙', key: 'tired' },
  { id: 'energized', emoji: '⚡', key: 'energized' },
  { id: 'reflective', emoji: '💭', key: 'reflective' },
  { id: 'inspired', emoji: '💡', key: 'inspired' },
];

export default function JournalApp({ currentLocale, dict }: JournalAppProps) {
  // Storage & State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Active Entry
  const [activeDate, setActiveDate] = useState<string>(() => getLocalTodayStr());
  const [activeEntryId, setActiveEntryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mood, setMood] = useState<MoodType | undefined>('calm');
  const [promptUsed, setPromptUsed] = useState<string | undefined>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Aesthetic Book Configuration
  const [bookView, setBookView] = useState<'page' | 'cover'>('page');
  const [pageTurnAnim, setPageTurnAnim] = useState<'next' | 'prev' | null>(null);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(() => loadStoredCoverConfig());
  const [showCoverModal, setShowCoverModal] = useState<boolean>(false);
  const [customCoverUrlInput, setCustomCoverUrlInput] = useState<string>('');

  const [paperStyle, setPaperStyle] = useState<'lined' | 'blank' | 'dots'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('daily_diary_paper_style') as 'lined' | 'blank' | 'dots') || 'lined';
    }
    return 'lined';
  });
  const [fontSizePx, setFontSizePx] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('daily_diary_font_size_px')) || 18;
    }
    return 18;
  });

  // UI Panels & Modals
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [moodPickerOpen, setMoodPickerOpen] = useState<boolean>(false);
  const [paperPickerOpen, setPaperPickerOpen] = useState<boolean>(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<boolean>(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('aesthetic');
  const [emojiSearch, setEmojiSearch] = useState<string>('');
  const [promptBannerOpen, setPromptBannerOpen] = useState<boolean>(false);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState<number>(0);

  // Search in Drawer
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  // Modals
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  // Theme
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);

  // PIN Form
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [setupPinError, setSetupPinError] = useState<string>('');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const moodPickerRef = useRef<HTMLDivElement | null>(null);
  const paperPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moodPickerRef.current && !moodPickerRef.current.contains(e.target as Node)) {
        setMoodPickerOpen(false);
      }
      if (paperPickerRef.current && !paperPickerRef.current.contains(e.target as Node)) {
        setPaperPickerOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Navbar triggers
  useEffect(() => {
    const storedTheme = loadStoredThemeConfig();
    setThemeConfig(storedTheme);

    const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);
    const handleOpenTheme = () => setShowThemeModal(true);
    const handleOpenPin = () => setShowPinSetupModal(true);
    const handleOpenExport = () => setShowExportModal(true);
    const handleToggleCover = () => setBookView((prev) => (prev === 'cover' ? 'page' : 'cover'));
    const handleOpenCoverModal = () => setShowCoverModal(true);

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    window.addEventListener('open-theme-modal', handleOpenTheme);
    window.addEventListener('open-pin-modal', handleOpenPin);
    window.addEventListener('open-export-modal', handleOpenExport);
    window.addEventListener('toggle-book-cover', handleToggleCover);
    window.addEventListener('open-cover-modal', handleOpenCoverModal);

    const secMeta = getPinSecurityMeta();
    if (secMeta.isEnabled) {
      setIsPinConfigured(true);
      setIsLocked(true);
      setIsLoaded(true);
    } else {
      setIsPinConfigured(false);
      setIsLocked(false);
      loadEntries(null, currentLocale).then((items) => {
        const cleanItems = items.filter(
          (e) => e.id !== 'welcome-entry-intro' && !e.tags?.includes('welcome') && !e.title?.includes('Welcome to DailyDiary')
        );
        setEntries(cleanItems);
        initActiveEntry(cleanItems, activeDate);
        setIsLoaded(true);
      });
    }

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('open-theme-modal', handleOpenTheme);
      window.removeEventListener('open-pin-modal', handleOpenPin);
      window.removeEventListener('open-export-modal', handleOpenExport);
      window.removeEventListener('toggle-book-cover', handleToggleCover);
      window.removeEventListener('open-cover-modal', handleOpenCoverModal);
    };
  }, [currentLocale]);

  // Sync content with contentEditable when switching entry
  useEffect(() => {
    if (editorRef.current && isLoaded) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
    }
  }, [activeEntryId, isLoaded]);

  const initActiveEntry = (items: JournalEntry[], dateStr: string) => {
    const forDate = items.filter((e) => e.date === dateStr);
    if (forDate.length > 0) {
      const current = forDate[0];
      setActiveEntryId(current.id);
      setTitle(current.title || '');
      setContent(current.content || '');
      setMood(current.mood || 'calm');
      setPromptUsed(current.promptUsed || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = current.content || '';
      }
    } else {
      const newId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setActiveEntryId(newId);
      setTitle('');
      setContent('');
      setMood('calm');
      setPromptUsed('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  };

  // Switch Date with Immediate Auto-Save Flush & Page Turn Animation
  const handleDateChange = (newDateStr: string, direction?: 'next' | 'prev') => {
    if (!newDateStr || newDateStr === activeDate) return;

    if (direction) {
      setPageTurnAnim(direction);
      setTimeout(() => setPageTurnAnim(null), 480);
    }

    // Flush current in-progress note if modified
    if (activeEntryId && (title.trim() || content.trim())) {
      const currentToSave: JournalEntry = {
        id: activeEntryId,
        date: activeDate,
        title,
        content,
        mood,
        promptUsed,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveEntry(currentToSave, cryptoKey).then((updated) => {
        setEntries(updated);
      });
    }

    setActiveDate(newDateStr);
    initActiveEntry(entries, newDateStr);
  };

  // Day Navigation (Forward / Backward) with 3D Page Turn Animation
  const handlePrevDay = () => {
    const prevDate = shiftDateStr(activeDate, -1);
    handleDateChange(prevDate, 'prev');
  };

  const handleNextDay = () => {
    const nextDate = shiftDateStr(activeDate, 1);
    handleDateChange(nextDate, 'next');
  };

  const handleJumpToToday = () => {
    handleDateChange(getLocalTodayStr());
  };

  // Emoji Insertion at Caret in Journal Editor
  const handleInsertEmoji = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const success = document.execCommand('insertText', false, emoji);
      if (!success) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(emoji));
          range.collapse(false);
        }
      }
      handleContentInput();
    }
  };

  // Cover Configuration Handlers
  const handleSelectCoverPreset = (presetId: string) => {
    const updated: CoverConfig = {
      ...coverConfig,
      presetId,
      customImageUrl: undefined,
    };
    setCoverConfig(updated);
    saveCoverConfig(updated);
  };

  const handleUploadCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated: CoverConfig = {
          ...coverConfig,
          customImageUrl: dataUrl,
        };
        setCoverConfig(updated);
        saveCoverConfig(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomCoverUrl = () => {
    if (!customCoverUrlInput.trim()) return;
    const updated: CoverConfig = {
      ...coverConfig,
      customImageUrl: customCoverUrlInput.trim(),
    };
    setCoverConfig(updated);
    saveCoverConfig(updated);
    setCustomCoverUrlInput('');
  };

  const handleCoverTextChange = (field: 'title' | 'subtitle' | 'monogram', val: string) => {
    const updated: CoverConfig = {
      ...coverConfig,
      [field]: val,
    };
    setCoverConfig(updated);
    saveCoverConfig(updated);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveDate(entry.date);
    setActiveEntryId(entry.id);
    setTitle(entry.title || '');
    setContent(entry.content || '');
    setMood(entry.mood || 'calm');
    setPromptUsed(entry.promptUsed || '');
    if (editorRef.current) {
      editorRef.current.innerHTML = entry.content || '';
    }
    setSidebarOpen(false);
  };

  const handleCreateNewEntry = () => {
    const todayStr = getLocalTodayStr();
    const newId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setActiveDate(todayStr);
    setActiveEntryId(newId);
    setTitle('');
    setContent('');
    setMood('calm');
    setPromptUsed('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setSidebarOpen(false);
    editorRef.current?.focus();
  };

  // Auto-Save
  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string, newMood?: MoodType, newPrompt?: string) => {
      if (isLocked) return;
      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const entryToSave: JournalEntry = {
          id: activeEntryId || `entry-${Date.now()}`,
          date: activeDate,
          title: newTitle,
          content: newContent,
          mood: newMood,
          promptUsed: newPrompt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          const updated = await saveEntry(entryToSave, cryptoKey);
          setEntries(updated);
          setSaveStatus('saved');
        } catch (err) {
          console.error('Auto-save error:', err);
          setSaveStatus('unsaved');
        }
      }, 500);
    },
    [activeEntryId, activeDate, cryptoKey, isLocked]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSaveStatus('unsaved');
    triggerAutoSave(val, content, mood, promptUsed);
  };

  const handleContentInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setContent(html);
      setSaveStatus('unsaved');
      triggerAutoSave(title, html, mood, promptUsed);
    }
  };

  // Rich Text Formatting Commands (Bold, Italic, Underline, Heading, Quote, List)
  const executeFormat = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      const html = editorRef.current.innerHTML;
      setContent(html);
      setSaveStatus('unsaved');
      triggerAutoSave(title, html, mood, promptUsed);
    }
  };

  // Select all text in the journal entry
  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editorRef.current) {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  // Copy selected text or full entry content
  const handleCopySelection = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const selectedText = window.getSelection()?.toString();
      const textToCopy = selectedText || (editorRef.current ? htmlToPlainText(editorRef.current.innerHTML) : content);
      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedFeedback(true);
        setTimeout(() => setCopiedFeedback(false), 1600);
      }
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        executeFormat('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        executeFormat('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        executeFormat('underline');
      }
    }
  };

  // Font Size Controls (Size Up & Size Down)
  const handleSizeUp = () => {
    const next = Math.min(fontSizePx + 2, 34);
    setFontSizePx(next);
    localStorage.setItem('daily_diary_font_size_px', String(next));
  };

  const handleSizeDown = () => {
    const next = Math.max(fontSizePx - 2, 12);
    setFontSizePx(next);
    localStorage.setItem('daily_diary_font_size_px', String(next));
  };

  // Paper Style Change
  const handleSelectPaper = (style: 'lined' | 'blank' | 'dots') => {
    setPaperStyle(style);
    localStorage.setItem('daily_diary_paper_style', style);
    setPaperPickerOpen(false);
  };

  const handleMoodSelect = (selectedMood: MoodType) => {
    setMood(selectedMood);
    setMoodPickerOpen(false);
    triggerAutoSave(title, content, selectedMood, promptUsed);
  };

  const handleUsePrompt = (promptText: string) => {
    setPromptUsed(promptText);
    const quoteHtml = `<blockquote><em>Reflection: ${promptText}</em></blockquote><p><br></p>`;
    const updatedHtml = content ? `${content}<br>${quoteHtml}` : quoteHtml;
    setContent(updatedHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = updatedHtml;
      editorRef.current.focus();
    }
    triggerAutoSave(title, updatedHtml, mood, promptText);
    setPromptBannerOpen(false);
  };

  const handleDeleteCurrentEntry = async () => {
    if (!window.confirm(dict.editor.confirmDelete)) return;
    try {
      const updated = await deleteEntry(activeEntryId, cryptoKey);
      setEntries(updated);
      initActiveEntry(updated, activeDate);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // PIN Unlock
  const handleUnlockWithPin = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setPinError('');

    if (enteredPin.length < 4) {
      setPinError(dict.pin.wrongPin);
      return;
    }

    try {
      const key = await verifyPin(enteredPin);
      if (key) {
        setCryptoKey(key);
        setIsLocked(false);
        setEnteredPin('');
        const items = await loadEntries(key, currentLocale);
        setEntries(items);
        initActiveEntry(items, activeDate);
      } else {
        setPinError(dict.pin.wrongPin);
      }
    } catch (err) {
      setPinError(dict.pin.wrongPin);
    }
  };

  const handleLockNow = () => {
    setIsLocked(true);
    setCryptoKey(null);
    setEntries([]);
    setShowPinSetupModal(false);
  };

  const handleEnablePin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSetupPinError('');

    if (newPin.length < 4) {
      setSetupPinError('PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setSetupPinError(dict.pin.pinMismatch);
      return;
    }

    try {
      const key = await enablePinLock(newPin, entries);
      setCryptoKey(key);
      setIsPinConfigured(true);
      setShowPinSetupModal(false);
      setNewPin('');
      setConfirmNewPin('');
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      setSetupPinError('Failed to configure PIN encryption.');
    }
  };

  const handleDisablePin = async () => {
    if (!window.confirm('Disable PIN lock? Your entries will remain in your browser storage.')) return;
    try {
      await disablePinLock(entries);
      setIsPinConfigured(false);
      setCryptoKey(null);
      setShowPinSetupModal(false);
    } catch (err) {
      console.error('Error disabling PIN:', err);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await restoreFromJsonFile(file);
      const mergedMap = new Map<string, JournalEntry>();
      for (const item of entries) mergedMap.set(item.id, item);
      for (const item of restored) mergedMap.set(item.id, item);
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));

      setEntries(mergedList);
      initActiveEntry(mergedList, activeDate);
      alert(dict.exportModal.restoreSuccess);
      setShowExportModal(false);
      confetti({ particleCount: 70, spread: 70 });
    } catch (err) {
      alert(dict.exportModal.restoreError);
    }
  };

  // Theme customizer
  const handleSelectPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const updated: ThemeConfig = {
      ...themeConfig,
      presetId,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      accentColor: preset.accentColor,
    };
    setThemeConfig(updated);
    saveThemeConfig(updated);
  };

  const handleCustomColorChange = (key: 'primaryColor' | 'accentColor', color: string) => {
    const updated: ThemeConfig = {
      ...themeConfig,
      presetId: 'custom',
      [key]: color,
      primaryHover: key === 'primaryColor' ? adjustHexColor(color, -15) : themeConfig.primaryHover,
      primaryLight: key === 'primaryColor' ? '#F0FDFA' : themeConfig.primaryLight,
    };
    setThemeConfig(updated);
    saveThemeConfig(updated);
  };

  const handleFontFamilyChange = (font: FontFamilyChoice) => {
    const updated: ThemeConfig = { ...themeConfig, fontFamily: font };
    setThemeConfig(updated);
    saveThemeConfig(updated);
  };

  const handleFontSizeChange = (size: FontSizeChoice) => {
    const updated: ThemeConfig = { ...themeConfig, fontSize: size };
    setThemeConfig(updated);
    saveThemeConfig(updated);
  };

  const streakStats = useMemo(() => calculateStreakStats(entries), [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const plainText = htmlToPlainText(e.content);
      const matchSearch =
        !searchQuery ||
        (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        plainText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMood = selectedMoodFilter === 'all' || e.mood === selectedMoodFilter;
      return matchSearch && matchMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  const plainContentText = useMemo(() => htmlToPlainText(content), [content]);

  const wordCount = useMemo(() => {
    return plainContentText ? plainContentText.split(/\s+/).filter(Boolean).length : 0;
  }, [plainContentText]);

  const readingTimeMin = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);

  const currentMoodObj = useMemo(() => {
    return MOOD_ITEMS.find((m) => m.id === mood) || MOOD_ITEMS[0];
  }, [mood]);

  const currentCoverPreset = useMemo(() => {
    return COVER_PRESETS.find((p) => p.id === coverConfig.presetId) || COVER_PRESETS[0];
  }, [coverConfig.presetId]);

  const activeCategoryEmojis = useMemo(() => {
    const cat = EMOJI_CATEGORIES.find((c) => c.id === selectedEmojiCategory) || EMOJI_CATEGORIES[0];
    if (!emojiSearch.trim()) return cat.emojis;
    const q = emojiSearch.toLowerCase().trim();
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return Array.from(new Set(all)).filter((e) => e.includes(q));
  }, [selectedEmojiCategory, emojiSearch]);

  const currentActiveEntry: JournalEntry = useMemo(() => {
    return {
      id: activeEntryId,
      date: activeDate,
      title,
      content,
      mood,
      promptUsed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [activeEntryId, activeDate, title, content, mood, promptUsed]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LOCKED SCREEN (PIN Lock)
  // --------------------------------------------------------------------------
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-lightBg/95 dark:bg-editorial-darkBg/95 backdrop-blur-sm">
        <div className="w-full max-w-sm p-6 sm:p-8 rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-editorial-borderLight dark:border-editorial-borderDark shadow-elevation text-center">
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-journal font-bold text-editorial-ink dark:text-stone-100">
            {dict.pin.title}
          </h2>
          <p className="mt-1 text-xs text-editorial-mutedLight dark:text-editorial-mutedDark">
            {dict.pin.subtitle}
          </p>

          <form onSubmit={handleUnlockWithPin} className="mt-5 space-y-3">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              autoFocus
              placeholder="••••"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.4em] py-2.5 rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand font-mono"
            />
            {pinError && <p className="text-xs text-rose-500 font-medium">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 font-bold text-xs shadow-subtle flex items-center justify-center gap-1.5 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{dict.pin.unlock}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AESTHETIC JOURNAL BOOK EXPERIENCE
  // --------------------------------------------------------------------------
  return (
    <div className={`relative min-h-[calc(100vh-3.5rem)] flex flex-col py-3 sm:py-6 px-2 sm:px-4 ${zenMode ? 'bg-editorial-lightBg dark:bg-editorial-darkBg' : ''}`}>
      
      {/* ZEN MODE EXIT BUTTON */}
      {zenMode && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-200">
          <button
            onClick={() => setZenMode(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-editorial-lightSurface/90 dark:bg-editorial-darkSurface/90 border border-editorial-borderLight dark:border-editorial-borderDark text-stone-700 dark:text-stone-300 shadow-elevation backdrop-blur text-xs font-medium hover:border-brand transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5 text-brand" />
            <span>{dict.nav.zenExit}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OUT DRAWER: Past Entries & Search (Hidden until requested)           */}
      {/* ========================================================================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-stone-950/30 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-80 sm:w-96 bg-editorial-lightSurface dark:bg-editorial-darkSurface border-r border-editorial-borderLight dark:border-editorial-borderDark shadow-2xl p-5 flex flex-col gap-4 z-50 animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-editorial-borderLight dark:border-editorial-borderDark">
              <div className="flex items-center gap-2">
                <span className="font-journal font-bold text-lg text-editorial-ink dark:text-stone-100">
                  {dict.sidebar.allEntries}
                </span>
                <span className="text-xs font-mono font-bold text-stone-900 bg-brand px-2 py-0.5 rounded-full shadow-subtle">
                  {entries.length}
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick New Entry */}
            <button
              onClick={handleCreateNewEntry}
              className="w-full py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-subtle transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{dict.nav.newEntry}</span>
            </button>

            {/* Consistency Streak Pill */}
            <div className="p-2.5 rounded-xl bg-[#FCE38A]/35 dark:bg-[#FCE38A]/10 border border-[#FCE38A]/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F38181] fill-[#F38181]/20" />
                <span className="font-bold text-stone-800 dark:text-[#FCE38A]">
                  {streakStats.currentStreak} {dict.sidebar.streakDays}
                </span>
              </div>
              <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                Best: {streakStats.longestStreak}d
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder={dict.sidebar.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-stone-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mood Filter in Drawer */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedMoodFilter('all')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  selectedMoodFilter === 'all'
                    ? 'bg-brand text-stone-900 shadow-subtle'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                All
              </button>
              {MOOD_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMoodFilter(selectedMoodFilter === item.id ? 'all' : item.id)}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] transition-all ${
                    selectedMoodFilter === item.id
                      ? 'bg-brand text-stone-900 shadow-subtle'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
                  }`}
                  title={dict.moods[item.key] || item.id}
                >
                  <span>{item.emoji}</span>
                </button>
              ))}
            </div>

            {/* Jump to Date Picker */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-stone-500 text-[11px] font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand" />
                <span>{dict.sidebar.jumpToDate}:</span>
              </span>
              <input
                type="date"
                value={activeDate}
                onChange={(e) => {
                  if (e.target.value) {
                    handleDateChange(e.target.value);
                    setSidebarOpen(false);
                  }
                }}
                className="text-xs py-1 px-2 rounded-lg border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 font-mono text-stone-700 dark:text-stone-300"
              />
            </div>

            {/* Past Entries List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredEntries.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400 rounded-xl border border-dashed border-editorial-borderLight dark:border-editorial-borderDark">
                  {dict.sidebar.noResults}
                </div>
              ) : (
                filteredEntries.map((item) => {
                  const isSelected = item.id === activeEntryId;
                  const preview = htmlToPlainText(item.content).slice(0, 70) || 'Empty';
                  const itemMood = MOOD_ITEMS.find((m) => m.id === item.mood);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectEntry(item)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                        isSelected
                          ? 'border-brand bg-brand/5 shadow-subtle'
                          : 'border-editorial-borderLight dark:border-editorial-borderDark hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-stone-400">{item.date}</span>
                        {itemMood && <span>{itemMood.emoji}</span>}
                      </div>
                      <div className="text-xs font-semibold text-editorial-ink dark:text-stone-100 truncate">
                        {item.title || 'Untitled'}
                      </div>
                      <div className="text-[11px] text-editorial-mutedLight dark:text-editorial-mutedDark line-clamp-2 mt-0.5 leading-relaxed">
                        {preview}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE AESTHETIC JOURNALING BOOK CANVAS                                      */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* THE AESTHETIC JOURNALING BOOK CANVAS (COVER OR OPEN NOTEBOOK)             */}
      {/* ========================================================================= */}
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col book-perspective">
        
        {bookView === 'cover' ? (
          /* ========================================================================= */
          /* THE CLOSED HARDCOVER BOOK VIEW (Custom Cover Art & Embossed Title)       */
          /* ========================================================================= */
          <div className="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center py-6 px-2 animate-in fade-in zoom-in-95 duration-300">
            <div
              className="w-full aspect-[3/4.2] max-w-md rounded-3xl p-8 sm:p-12 shadow-2xl relative flex flex-col justify-between overflow-hidden border-4 border-stone-900/10 dark:border-stone-100/10 page-stack-edges transition-all"
              style={{
                background: coverConfig.customImageUrl
                  ? `url(${coverConfig.customImageUrl}) center/cover no-repeat`
                  : currentCoverPreset.backgroundStyle,
                color: currentCoverPreset.textColor,
              }}
            >
              {/* Spine Crease on Left */}
              <div className="absolute inset-y-0 left-0 w-8 book-spine-crease pointer-events-none" />
              <div className="absolute inset-y-0 left-8 w-[1px] bg-black/15 dark:bg-white/10 pointer-events-none" />

              {/* Decorative Gold Inset Border Frame */}
              <div
                className="absolute inset-4 sm:inset-6 rounded-2xl pointer-events-none border-2 border-dashed"
                style={{ borderColor: currentCoverPreset.accentBorder }}
              />

              {/* Ribbon Bookmark Hanging Down from Top */}
              <div
                className="absolute top-0 right-10 w-6 h-14 shadow-lg rounded-b-[2px] pointer-events-none z-10"
                style={{ backgroundColor: '#F38181' }}
              >
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[8px] border-b-black/15 absolute bottom-0 left-0" />
              </div>

              {/* Ribbon Bookmark Tip Peeking from Bottom Page Stack */}
              <div
                className="absolute bottom-0 right-14 w-5 h-6 shadow-sm rounded-t-[2px] pointer-events-none opacity-80"
                style={{ backgroundColor: '#F38181' }}
              />

              {/* Top Header / Monogram Medallion */}
              <div className="relative z-10 text-center pt-4">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center font-journal font-bold text-2xl sm:text-3xl shadow-elevation backdrop-blur-md border-2"
                  style={{ borderColor: currentCoverPreset.accentBorder, backgroundColor: 'rgba(0,0,0,0.12)' }}
                >
                  <span className="gold-emboss">{coverConfig.monogram || 'D'}</span>
                </div>
              </div>

              {/* Center Title and Subtitle */}
              <div className="relative z-10 text-center px-4 my-auto">
                <h1 className="font-journal font-bold text-2xl sm:text-4xl tracking-wider uppercase gold-emboss leading-tight">
                  {coverConfig.title || 'My Daily Diary'}
                </h1>
                <div className="w-16 h-[2px] mx-auto my-3 opacity-60" style={{ backgroundColor: currentCoverPreset.textColor }} />
                <p className="text-xs sm:text-sm tracking-widest font-mono uppercase opacity-85">
                  {coverConfig.subtitle || '100% Private Browser Journal'}
                </p>
              </div>

              {/* Bottom Cover Action Buttons */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookView('page');
                    confetti({ particleCount: 50, spread: 60 });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 font-bold text-xs shadow-elevation hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 backdrop-blur cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-brand" />
                  <span>Open Journal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCoverModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/35 text-current border border-current/30 font-semibold text-xs shadow-subtle hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 backdrop-blur cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Customize Cover</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* THE OPEN HARDCOVER NOTEBOOK CANVAS (Pages & Writing)                      */
          /* ========================================================================= */
          <>
            {/* PROMINENT, UNMISTAKABLE DAY NAVIGATION BAR */}
            {!zenMode && (
              <div className="flex items-center justify-between gap-2 mb-3 px-1 sm:px-2">
                
                {/* PREVIOUS DAY (Yesterday) */}
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-editorial-lightSurface dark:bg-editorial-darkSurface hover:border-brand hover:text-brand text-editorial-ink dark:text-stone-200 text-xs font-semibold shadow-subtle transition-all active:scale-95 cursor-pointer"
                  title="Go to Previous Day (Turn Page)"
                >
                  <ChevronLeft className="w-4 h-4 text-brand" />
                  <span className="hidden sm:inline">Yesterday</span>
                </button>

                {/* DATE DISPLAY, COVER SWITCHER & TODAY JUMPER */}
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-center">
                  {/* View Book Cover Button */}
                  <button
                    type="button"
                    onClick={() => setBookView('cover')}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-stone-200/90 dark:border-stone-800/90 bg-stone-100/70 dark:bg-stone-800/70 hover:border-brand text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1 shadow-subtle transition-all"
                    title="Close book and view hardcover"
                  >
                    <Book className="w-3.5 h-3.5 text-brand" />
                    <span className="hidden md:inline">Cover</span>
                  </button>

                  <span className="font-journal font-bold text-xs sm:text-base text-editorial-ink dark:text-stone-100">
                    {formatDisplayDate(activeDate, currentLocale, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {isTodayStr(activeDate) ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                      {dict.sidebar.today}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleJumpToToday}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FCE38A] hover:bg-[#ebd279] text-stone-900 shadow-subtle border border-[#ebd279] transition-all cursor-pointer"
                      title="Jump back to Today"
                    >
                      Return to Today
                    </button>
                  )}

                  {/* Configure Cover Art Pill */}
                  <button
                    type="button"
                    onClick={() => setShowCoverModal(true)}
                    className="p-1.5 rounded-lg border border-stone-200/90 dark:border-stone-800/90 bg-stone-100/70 dark:bg-stone-800/70 hover:border-brand text-stone-600 dark:text-stone-300 text-xs font-medium shadow-subtle transition-all"
                    title="Change Book Cover Image & Style"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* NEXT DAY (Tomorrow) - FULLY WORKING & RESPONSIVE WITH PAGE TURN */}
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-editorial-lightSurface dark:bg-editorial-darkSurface hover:border-brand hover:text-brand text-editorial-ink dark:text-stone-200 text-xs font-semibold shadow-subtle transition-all active:scale-95 cursor-pointer"
                  title="Go to Next Day (Turn Page)"
                >
                  <span className="hidden sm:inline">Tomorrow</span>
                  <ChevronRight className="w-4 h-4 text-brand" />
                </button>
              </div>
            )}

            {/* HARDCOVER BACKING FRAME WRAPPING OPEN PAGES */}
            <div
              className="relative flex-1 flex flex-col p-1 sm:p-2 rounded-[22px] sm:rounded-[30px] transition-all"
              style={{
                background: coverConfig.customImageUrl
                  ? `url(${coverConfig.customImageUrl}) center/cover no-repeat`
                  : currentCoverPreset.backgroundStyle,
              }}
            >
              {/* THE PHYSICAL JOURNAL NOTEBOOK PAGE LEAF */}
              <div
                className={`relative flex-1 flex flex-col rounded-2xl sm:rounded-3xl bg-[#FDFBF7] dark:bg-[#1A1816] border border-stone-200/90 dark:border-stone-800/90 page-stack-edges page-leaf overflow-hidden transition-all duration-300 ${
                  pageTurnAnim === 'next'
                    ? 'anim-page-turn-next'
                    : pageTurnAnim === 'prev'
                    ? 'anim-page-turn-prev'
                    : ''
                }`}
              >
                
                {/* Notebook Spine Accent (Left Leather/Linen Trim) */}
                <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-stone-300/40 via-stone-200/20 to-transparent dark:from-stone-900 dark:via-stone-950/40 border-r border-stone-200/60 dark:border-stone-800/60 pointer-events-none" />

                {/* Satin Bookmark Ribbon (Top-Right Corner) */}
                <div
                  className="absolute top-0 right-8 w-5 h-9 shadow-md rounded-b-[2px] pointer-events-none z-10 hidden sm:block opacity-95 transition-all"
                  style={{ backgroundColor: '#F38181' }}
                >
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[6px] border-b-[#FDFBF7] dark:border-b-[#1A1816] absolute bottom-0 left-0" />
                </div>

                {/* ===================================================================== */}
                {/* RICH FORMATTING & WRITING TOOLBAR (Bold, Emoji, Size Up, Paper, etc.) */}
                {/* ===================================================================== */}
                {!zenMode && (
                  <div className="p-2 sm:px-6 sm:py-2.5 border-b border-stone-200/70 dark:border-stone-800/70 bg-[#F7F4EE]/90 dark:bg-[#151413]/90 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 dark:text-stone-300 no-print pl-3 sm:pl-6">
                    
                    {/* Left: Text Formatting, Font Size, and Edit Tools */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      
                      {/* Cluster 1: BOLD, ITALIC, UNDERLINE, HEADING, QUOTE, LIST */}
                      <div className="flex items-center gap-0.5 bg-stone-200/60 dark:bg-stone-800/60 rounded-xl p-0.5 border border-stone-200/80 dark:border-stone-700/80">
                        {/* BOLD BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('bold')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Bold (Ctrl+B)"
                          aria-label="Bold"
                        >
                          <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        {/* ITALIC BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('italic')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Italic (Ctrl+I)"
                          aria-label="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>

                        {/* UNDERLINE BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('underline')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Underline (Ctrl+U)"
                          aria-label="Underline"
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>

                        {/* HEADING BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('formatBlock', '<h3>')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Heading"
                          aria-label="Heading"
                        >
                          <Heading className="w-3.5 h-3.5" />
                        </button>

                        {/* QUOTE BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('formatBlock', '<blockquote>')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Quote Block"
                          aria-label="Quote Block"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>

                        {/* LIST BUTTON */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeFormat('insertUnorderedList')}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                          title="Bullet List"
                          aria-label="Bullet List"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Cluster 2: FONT SIZE CONTROLS (Size Down & Size Up) - PROMINENT, HIGH CONTRAST & ALWAYS VISIBLE ON MOBILE */}
                      <div className="flex items-center rounded-xl border border-stone-300 dark:border-stone-600 bg-editorial-lightSurface dark:bg-editorial-darkSurface shadow-subtle p-0.5">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSizeDown}
                          className="h-7 px-2 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-brand transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-0.5"
                          title="Decrease Font Size (A⁻)"
                          aria-label="Decrease Font Size"
                        >
                          <span className="font-serif font-bold text-sm">A</span>
                          <span className="text-[10px] font-bold">−</span>
                        </button>
                        
                        <span className="h-5 px-1.5 min-w-[34px] flex items-center justify-center text-[11px] font-mono font-bold text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-800/80 rounded border border-stone-200 dark:border-stone-700 select-none">
                          {fontSizePx}px
                        </span>
                        
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSizeUp}
                          className="h-7 px-2 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-brand transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-0.5"
                          title="Increase Font Size (A⁺)"
                          aria-label="Increase Font Size"
                        >
                          <span className="font-serif font-bold text-base">A</span>
                          <span className="text-[10px] font-bold">+</span>
                        </button>
                      </div>

                      {/* Cluster 3: SELECT ALL, COPY & EMOJI TOOLS */}
                      <div className="flex items-center gap-0.5 bg-stone-200/60 dark:bg-stone-800/60 rounded-xl p-0.5 border border-stone-200/80 dark:border-stone-700/80">
                        {/* SELECT ALL TEXT OPTION */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSelectAll}
                          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Select All Text in Entry (Ctrl+A)"
                          aria-label="Select All Text"
                        >
                          <svg className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                          <span className="text-[11px] font-semibold hidden sm:inline">Select All</span>
                        </button>

                        {/* COPY SELECTED TEXT OR ENTIRE NOTE */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCopySelection}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                            copiedFeedback
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                              : 'hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                          }`}
                          title="Copy Selected Text (or Entire Page)"
                          aria-label="Copy Text"
                        >
                          {copiedFeedback ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[11px] font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                              <span className="text-[11px] font-semibold hidden md:inline">Copy</span>
                            </>
                          )}
                        </button>

                        {/* EMOJI PICKER POPOVER TRIGGER */}
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            type="button"
                            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                              emojiPickerOpen
                                ? 'bg-brand text-stone-900 font-bold'
                                : 'hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                            }`}
                            title="Insert Emojis & Aesthetic Symbols"
                            aria-label="Insert Emoji"
                          >
                            <Smile className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                            <span className="text-[11px] font-semibold hidden sm:inline">Emoji</span>
                          </button>

                          {/* EMOJI FLOATING PALETTE */}
                          {emojiPickerOpen && (
                            <div className="absolute -left-16 sm:left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-stone-200 dark:border-stone-800 shadow-elevation p-3 z-40 animate-in fade-in duration-150">
                              
                              {/* Emoji Search Input */}
                              <div className="relative mb-2">
                                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-stone-400" />
                                <input
                                  type="text"
                                  placeholder="Search emojis..."
                                  value={emojiSearch}
                                  onChange={(e) => setEmojiSearch(e.target.value)}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand"
                                />
                                {emojiSearch && (
                                  <button onClick={() => setEmojiSearch('')} className="absolute right-2 top-2 text-stone-400">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Category Switcher Tabs */}
                              <div className="flex items-center gap-1 pb-2 border-b border-editorial-borderLight dark:border-editorial-borderDark overflow-x-auto no-scrollbar">
                                {EMOJI_CATEGORIES.map((cat) => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEmojiCategory(cat.id);
                                      setEmojiSearch('');
                                    }}
                                    className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 whitespace-nowrap transition-colors ${
                                      selectedEmojiCategory === cat.id && !emojiSearch
                                        ? 'bg-brand text-stone-900 font-bold'
                                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                                    }`}
                                  >
                                    <span>{cat.icon}</span>
                                    <span className="text-[10px] hidden sm:inline">{cat.name.split(' ')[0]}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Emoji Grid */}
                              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 pt-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {activeCategoryEmojis.length === 0 ? (
                                  <div className="col-span-full py-4 text-center text-xs text-stone-400">
                                    No emojis found
                                  </div>
                                ) : (
                                  activeCategoryEmojis.map((em, idx) => (
                                    <button
                                      key={`${em}-${idx}`}
                                      type="button"
                                      onClick={() => handleInsertEmoji(em)}
                                      className="w-8 h-8 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:scale-125 transition-transform flex items-center justify-center text-base sm:text-lg cursor-pointer"
                                      title={em}
                                    >
                                      {em}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

              {/* Right Group: Paper Style, Mood Pill & Inspire Me */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                
                {/* Paper Style Selector (Lined / Blank / Dots) */}
                <div className="relative" ref={paperPickerRef}>
                  <button
                    type="button"
                    onClick={() => setPaperPickerOpen(!paperPickerOpen)}
                    className="px-2 py-1 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-800/60 hover:border-brand text-[11px] font-medium flex items-center gap-1 transition-all"
                    title="Change Paper Texture"
                  >
                    <AlignLeft className="w-3 h-3 text-stone-500" />
                    <span className="capitalize">{paperStyle}</span>
                  </button>

                  {paperPickerOpen && (
                    <div className="absolute left-0 mt-2 w-36 sm:w-40 rounded-xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-stone-200 dark:border-stone-800 shadow-elevation p-1 z-30 animate-in fade-in duration-100 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSelectPaper('lined')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 ${
                          paperStyle === 'lined' ? 'bg-brand/10 text-brand font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 whitespace-nowrap">📜 Lined Paper</span>
                        {paperStyle === 'lined' && <Check className="w-3 h-3 text-brand shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPaper('blank')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 ${
                          paperStyle === 'blank' ? 'bg-brand/10 text-brand font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 whitespace-nowrap">📄 Blank Paper</span>
                        {paperStyle === 'blank' && <Check className="w-3 h-3 text-brand shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPaper('dots')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 ${
                          paperStyle === 'dots' ? 'bg-brand/10 text-brand font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 whitespace-nowrap">⠇ Dot Grid</span>
                        {paperStyle === 'dots' && <Check className="w-3 h-3 text-brand shrink-0" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Mood Pill */}
                <div className="relative" ref={moodPickerRef}>
                  <button
                    type="button"
                    onClick={() => setMoodPickerOpen(!moodPickerOpen)}
                    className="px-2.5 py-1 rounded-full border border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-800/60 hover:border-brand text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>{currentMoodObj.emoji}</span>
                    <span className="hidden sm:inline">{dict.moods[currentMoodObj.key]}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {moodPickerOpen && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-36 rounded-xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-stone-200 dark:border-stone-800 shadow-elevation p-1 z-30 animate-in fade-in duration-100">
                      {MOOD_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleMoodSelect(item.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                            mood === item.id
                              ? 'bg-brand/10 text-brand font-bold'
                              : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-editorial-ink dark:text-stone-200'
                          }`}
                        >
                          <span>{item.emoji}</span>
                          <span>{dict.moods[item.key]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inspire Me */}
                <button
                  type="button"
                  onClick={() => setPromptBannerOpen(!promptBannerOpen)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-stone-900 bg-[#FCE38A] hover:bg-[#ebd279] border border-[#ebd279] flex items-center gap-1 transition-all shadow-subtle"
                  title="Inspire me with a daily prompt"
                >
                  <Sparkles className="w-3 h-3 text-[#F38181] fill-[#F38181]" />
                  <span className="hidden sm:inline">{dict.editor.inspireMe}</span>
                </button>

                {/* Zen Toggle */}
                <button
                  type="button"
                  onClick={() => setZenMode(true)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  title="Zen Mode"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* INLINE INSPIRATIONAL PROMPT (If requested) */}
          {!zenMode && promptBannerOpen && (
            <div className="mx-6 sm:mx-10 mt-4 p-3 rounded-xl bg-[#FCE38A]/30 dark:bg-[#FCE38A]/10 border border-[#FCE38A]/70 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
              <span className="italic font-journal text-stone-800 dark:text-stone-100 text-sm flex-1">
                "{dict.prompts[currentPromptIdx]}"
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleUsePrompt(dict.prompts[currentPromptIdx])}
                  className="px-2.5 py-1 rounded-md bg-[#F38181] hover:bg-[#E46F6F] text-white font-bold text-[11px] shadow-subtle transition-colors"
                >
                  {dict.editor.usePrompt}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPromptIdx((prev) => (prev + 1) % dict.prompts.length)}
                  className="p-1 rounded-md text-stone-700 dark:text-stone-300 hover:bg-[#FCE38A]/40 transition-colors"
                  title="Next Prompt"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPromptBannerOpen(false)}
                  className="p-1 rounded-md text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* THE NOTEBOOK PAGE: Title & Rich Content Writing Area                 */}
          {/* ===================================================================== */}
          <div className="flex-1 flex flex-col px-6 sm:px-12 py-6 sm:py-8 pl-8 sm:pl-14">
            
            {/* Journal Title */}
            <input
              type="text"
              placeholder={dict.editor.titlePlaceholder}
              value={title}
              onChange={handleTitleChange}
              className="w-full font-journal font-bold text-2xl sm:text-3xl text-editorial-ink dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700 bg-transparent border-none focus:outline-none tracking-tight pb-2 mb-3 border-b border-transparent focus:border-stone-200 dark:focus:border-stone-800 transition-colors"
            />

            {/* Rich Text Writing Canvas (Bold, Size Up, Ruled / Dots Paper) */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onKeyDown={handleEditorKeyDown}
              data-placeholder={dict.editor.contentPlaceholder}
              style={{
                fontSize: `${fontSizePx}px`,
                lineHeight: paperStyle === 'lined' ? '36px' : '1.85',
              }}
              className={`flex-1 font-journal text-editorial-ink dark:text-stone-100 journal-rich-content ${
                paperStyle === 'lined'
                  ? 'paper-lined'
                  : paperStyle === 'dots'
                  ? 'paper-dots'
                  : 'paper-blank'
              }`}
            />
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM NOTEBOOK FOOTER: Metrics & Auto-Save Checkmark                */}
          {/* ===================================================================== */}
          <div className="px-6 sm:px-12 py-3 border-t border-stone-200/60 dark:border-stone-800/60 bg-[#F9F7F2]/60 dark:bg-[#161514]/60 flex items-center justify-between text-[11px] text-stone-500 font-mono no-print">
            <div className="flex items-center gap-2">
              <span>{wordCount} {dict.editor.words}</span>
              <span>•</span>
              <span>{readingTimeMin} {dict.editor.readMin}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-brand" />
                    <span>{dict.editor.saving}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{dict.editor.saved}</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleDeleteCurrentEntry}
                className="text-stone-400 hover:text-rose-500 p-1 rounded transition-colors"
                title={dict.editor.deleteEntry}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )}

</div>

      {/* ========================================================================= */}
      {/* THEME & COLOR PALETTE MODAL                                               */}
      {/* ========================================================================= */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-editorial-borderLight dark:border-editorial-borderDark shadow-elevation">
            <div className="flex items-center justify-between pb-3 border-b border-editorial-borderLight dark:border-editorial-borderDark">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand" />
                <h3 className="font-journal font-bold text-base text-editorial-ink dark:text-stone-100">
                  {dict.themeModal.title}
                </h3>
              </div>
              <button onClick={() => setShowThemeModal(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                {dict.themeModal.presets}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = themeConfig.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? 'border-brand ring-2 ring-brand bg-brand/10'
                          : 'border-editorial-borderLight dark:border-editorial-borderDark hover:border-stone-400'
                      }`}
                    >
                      {preset.id === 'pastel-aesthetic' ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden grid grid-cols-2 shadow-sm border border-black/10">
                          <span style={{ backgroundColor: '#F38181' }} />
                          <span style={{ backgroundColor: '#FCE38A' }} />
                          <span style={{ backgroundColor: '#EAFFD0' }} />
                          <span style={{ backgroundColor: '#95E1D3' }} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full overflow-hidden flex shadow-sm border border-black/10">
                          <span className="w-1/2 h-full" style={{ backgroundColor: preset.primaryColor }} />
                          <span className="w-1/2 h-full" style={{ backgroundColor: preset.accentColor }} />
                        </div>
                      )}
                      <span className="text-[10px] font-semibold text-editorial-ink dark:text-stone-200 truncate w-full">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="mt-5 pt-3 border-t border-editorial-borderLight dark:border-editorial-borderDark flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                Custom Accent Color:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeConfig.primaryColor}
                  onChange={(e) => handleCustomColorChange('primaryColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-[11px] text-stone-400">{themeConfig.primaryColor}</span>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-4 pt-3 border-t border-editorial-borderLight dark:border-editorial-borderDark">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                {dict.themeModal.fontFamily}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFontFamilyChange('serif')}
                  className={`py-1.5 rounded-lg border text-xs font-serif ${
                    themeConfig.fontFamily === 'serif' ? 'border-brand font-bold bg-brand/10' : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  Serif
                </button>
                <button
                  type="button"
                  onClick={() => handleFontFamilyChange('sans')}
                  className={`py-1.5 rounded-lg border text-xs font-sans-clean ${
                    themeConfig.fontFamily === 'sans' ? 'border-brand font-bold bg-brand/10' : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  Sans
                </button>
                <button
                  type="button"
                  onClick={() => handleFontFamilyChange('mono')}
                  className={`py-1.5 rounded-lg border text-xs font-mono ${
                    themeConfig.fontFamily === 'mono' ? 'border-brand font-bold bg-brand/10' : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  Mono
                </button>
              </div>

              {/* Font Size Setting in Theme Modal */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">
                  {dict.themeModal.fontSize}:
                </span>
                <div className="flex items-center gap-1.5">
                  {(['sm', 'base', 'lg'] as FontSizeChoice[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleFontSizeChange(sz)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                        themeConfig.fontSize === sz
                          ? 'bg-brand text-stone-900 border-brand shadow-subtle'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {sz === 'sm' ? dict.themeModal.sizeSm : sz === 'lg' ? dict.themeModal.sizeLg : dict.themeModal.sizeBase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 text-xs font-bold shadow-subtle transition-colors"
              >
                {dict.themeModal.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPORT & BACKUP MODAL                                                     */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-editorial-borderLight dark:border-editorial-borderDark shadow-elevation">
            <div className="flex items-center justify-between pb-3 border-b border-editorial-borderLight dark:border-editorial-borderDark">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-brand" />
                <h3 className="font-journal font-bold text-base text-editorial-ink dark:text-stone-100">
                  {dict.exportModal.title}
                </h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Export This Note ({activeDate})
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => exportEntryToMarkdown(currentActiveEntry)}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-brand text-xs flex flex-col items-center gap-1"
                >
                  <FileCode className="w-4 h-4 text-brand" />
                  <span>Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportEntryToPlainText(currentActiveEntry)}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-brand text-xs flex flex-col items-center gap-1"
                >
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  onClick={printCurrentEntry}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-brand text-xs flex flex-col items-center gap-1"
                >
                  <Printer className="w-4 h-4 text-brand" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-editorial-borderLight dark:border-editorial-borderDark space-y-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Full Backup Vault
              </span>

              <button
                type="button"
                onClick={() => backupAllDataToJson(entries)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-brand text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-brand" />
                  <span className="font-semibold">{dict.exportModal.backupJson}</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">{entries.length} notes</span>
              </button>

              <label className="w-full p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-brand text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-brand" />
                <span className="font-semibold">{dict.exportModal.restoreJson}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 text-xs font-bold shadow-subtle transition-colors"
              >
                {dict.exportModal.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PIN SECURITY MODAL                                                        */}
      {/* ========================================================================= */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-editorial-borderLight dark:border-editorial-borderDark shadow-elevation">
            <div className="flex items-center justify-between pb-3 border-b border-editorial-borderLight dark:border-editorial-borderDark">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <h3 className="font-journal font-bold text-base text-editorial-ink dark:text-stone-100">
                  {dict.pin.setupTitle}
                </h3>
              </div>
              <button onClick={() => setShowPinSetupModal(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-editorial-mutedLight dark:text-editorial-mutedDark">
              {dict.pin.setupSubtitle}
            </p>

            {isPinConfigured ? (
              <div className="mt-4 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIN encryption is active (AES-GCM 256-bit).</span>
                </div>

                <button
                  type="button"
                  onClick={handleLockNow}
                  className="w-full py-2 rounded-xl bg-[#FCE38A] hover:bg-[#ebd279] text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#ebd279]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{dict.pin.lockNow}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisablePin}
                  className="w-full py-1.5 rounded-xl border border-rose-300 text-rose-600 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  {dict.pin.disableLock}
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnablePin} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-editorial-ink dark:text-stone-200 block mb-1">
                    {dict.pin.enterPin}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full text-center text-xl tracking-[0.3em] py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-editorial-ink dark:text-stone-200 block mb-1">
                    {dict.pin.confirmPin}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="••••"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    className="w-full text-center text-xl tracking-[0.3em] py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  />
                </div>

                {setupPinError && <p className="text-xs text-rose-500 text-center">{setupPinError}</p>}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinSetupModal(false)}
                    className="px-3 py-1.5 text-xs text-stone-500"
                  >
                    {dict.pin.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 text-xs font-bold shadow-subtle transition-colors"
                  >
                    {dict.pin.enableLock}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COVER CUSTOMIZER MODAL                                                    */}
      {/* ========================================================================= */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg p-5 sm:p-6 rounded-2xl bg-editorial-lightSurface dark:bg-editorial-darkSurface border border-editorial-borderLight dark:border-editorial-borderDark shadow-elevation my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-editorial-borderLight dark:border-editorial-borderDark">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand" />
                <h3 className="font-journal font-bold text-base text-editorial-ink dark:text-stone-100">
                  Configure Book Cover
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Cover Mini Preview */}
            <div className="mt-4 flex items-center justify-center">
              <div
                className="w-48 aspect-[3/4.2] rounded-2xl p-4 shadow-lg relative flex flex-col justify-between overflow-hidden border border-black/10"
                style={{
                  background: coverConfig.customImageUrl
                    ? `url(${coverConfig.customImageUrl}) center/cover no-repeat`
                    : currentCoverPreset.backgroundStyle,
                  color: currentCoverPreset.textColor,
                }}
              >
                <div className="absolute inset-y-0 left-0 w-3 book-spine-crease pointer-events-none" />
                <div
                  className="absolute inset-2 rounded-xl pointer-events-none border border-dashed"
                  style={{ borderColor: currentCoverPreset.accentBorder }}
                />
                
                {/* Ribbon */}
                <div
                  className="absolute top-0 right-4 w-3.5 h-8 shadow-sm rounded-b-[1px] pointer-events-none z-10"
                  style={{ backgroundColor: '#F38181' }}
                />

                <div className="relative z-10 text-center pt-1">
                  <div
                    className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-journal font-bold text-xs shadow border"
                    style={{ borderColor: currentCoverPreset.accentBorder, backgroundColor: 'rgba(0,0,0,0.15)' }}
                  >
                    <span>{coverConfig.monogram || 'D'}</span>
                  </div>
                </div>

                <div className="relative z-10 text-center my-auto px-1">
                  <div className="font-journal font-bold text-xs tracking-wider uppercase truncate gold-emboss">
                    {coverConfig.title || 'My Daily Diary'}
                  </div>
                  <div className="text-[8px] font-mono tracking-widest uppercase opacity-80 truncate mt-0.5">
                    {coverConfig.subtitle || 'Private Journal'}
                  </div>
                </div>

                <div className="relative z-10 text-center text-[8px] font-mono opacity-60">
                  Preview
                </div>
              </div>
            </div>

            {/* Curated Presets */}
            <div className="mt-5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Aesthetic Cover Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => {
                  const isSelected = !coverConfig.customImageUrl && coverConfig.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectCoverPreset(preset.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'border-brand ring-2 ring-brand bg-brand/10 shadow-subtle'
                          : 'border-editorial-borderLight dark:border-editorial-borderDark hover:border-stone-400'
                      }`}
                    >
                      <div
                        className="w-full h-12 rounded-lg shadow-sm border border-black/10 relative overflow-hidden flex items-center justify-center"
                        style={{ background: preset.previewGradient }}
                      >
                        <div className="w-1.5 h-full absolute left-0 bg-black/20" />
                        <span className="text-[10px] font-bold" style={{ color: preset.textColor }}>
                          {preset.name.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-editorial-ink dark:text-stone-200 truncate w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload or Custom Image URL */}
            <div className="mt-5 pt-3 border-t border-editorial-borderLight dark:border-editorial-borderDark space-y-3">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Custom Cover Image
              </span>

              {/* Upload File */}
              <label className="w-full p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-brand text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors bg-stone-50 dark:bg-stone-900/50">
                <Upload className="w-3.5 h-3.5 text-brand" />
                <span>Upload Custom Image from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCoverImage}
                  className="hidden"
                />
              </label>

              {/* Custom Image URL */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or enter image URL (e.g. https://...)"
                  value={customCoverUrlInput}
                  onChange={(e) => setCustomCoverUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomCoverUrl}
                  className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 font-bold text-xs shadow-subtle transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {coverConfig.customImageUrl && (
                <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-100 dark:bg-stone-800 p-2 rounded-xl">
                  <span className="truncate max-w-[200px]">Custom Image active</span>
                  <button
                    type="button"
                    onClick={() => handleSelectCoverPreset(coverConfig.presetId || 'pastel-meadow')}
                    className="text-rose-500 hover:underline font-semibold"
                  >
                    Remove custom image
                  </button>
                </div>
              )}
            </div>

            {/* Embossed Text Personalization */}
            <div className="mt-5 pt-3 border-t border-editorial-borderLight dark:border-editorial-borderDark space-y-2.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Embossed Cover Typography
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-stone-400 block mb-0.5">Diary Title</label>
                  <input
                    type="text"
                    value={coverConfig.title}
                    onChange={(e) => handleCoverTextChange('title', e.target.value)}
                    placeholder="My Daily Diary"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Monogram</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={coverConfig.monogram}
                    onChange={(e) => handleCoverTextChange('monogram', e.target.value)}
                    placeholder="D"
                    className="w-full text-center px-2.5 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Cover Subtitle</label>
                <input
                  type="text"
                  value={coverConfig.subtitle}
                  onChange={(e) => handleCoverTextChange('subtitle', e.target.value)}
                  placeholder="100% Private Browser Journal"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-editorial-borderLight dark:border-editorial-borderDark bg-stone-50 dark:bg-stone-900 text-editorial-ink dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCoverModal(false);
                  confetti({ particleCount: 30, spread: 50 });
                }}
                className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-stone-900 font-bold text-xs shadow-subtle transition-all cursor-pointer"
              >
                Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

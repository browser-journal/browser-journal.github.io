import type { JournalEntry, LocalizedDictionary, MoodType } from '../types/journal';
import { COVER_PRESETS, type CoverConfig } from './cover';
import { formatDisplayDate } from './date';
import { htmlToPlainText } from './htmlMarkdown';

export interface ExportJournalPDFOptions {
  entries: JournalEntry[];
  coverConfig: CoverConfig;
  currentLocale: string;
  dict: LocalizedDictionary;
}

const MOOD_META: Record<MoodType, { emoji: string; label: string }> = {
  calm: { emoji: '🌱', label: 'Calm' },
  focused: { emoji: '⚡', label: 'Focused' },
  grateful: { emoji: '✨', label: 'Grateful' },
  happy: { emoji: '😊', label: 'Happy' },
  tired: { emoji: '🌙', label: 'Tired' },
  energized: { emoji: '🔥', label: 'Energized' },
  reflective: { emoji: '🌊', label: 'Reflective' },
  inspired: { emoji: '💡', label: 'Inspired' },
};

const DEFAULT_MOOD_META = { emoji: '🌱', label: 'Reflective' };

/**
 * Compiles the entire journal with its custom cover, table of contents,
 * and all formatted journal entries into an aesthetic, print-ready PDF book.
 */
export function exportFullJournalPDF({
  entries,
  coverConfig,
  currentLocale,
  dict,
}: ExportJournalPDFOptions): void {
  if (typeof window === 'undefined') return;

  // 1. Sort entries chronologically (oldest to newest)
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // 2. Identify cover style preset
  const preset =
    COVER_PRESETS.find((p) => p.id === coverConfig.presetId) || COVER_PRESETS[0];

  const coverBg = coverConfig.customImageUrl
    ? `background: url('${coverConfig.customImageUrl}') center/cover no-repeat;`
    : `background: ${preset.backgroundStyle};`;

  const coverTextColor = preset.textColor || '#1C1917';
  const coverAccentBorder = preset.accentBorder || 'rgba(0,0,0,0.25)';

  // 3. Compute stats for cover and TOC
  const totalEntries = sortedEntries.length;
  const totalWords = sortedEntries.reduce((sum, e) => {
    const text = htmlToPlainText(e.content || '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return sum + words;
  }, 0);

  const firstDateFormatted = sortedEntries[0]
    ? formatDisplayDate(sortedEntries[0].date, currentLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const lastDateFormatted = sortedEntries[sortedEntries.length - 1]
    ? formatDisplayDate(sortedEntries[sortedEntries.length - 1].date, currentLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const dateRangeStr =
    firstDateFormatted && lastDateFormatted
      ? firstDateFormatted === lastDateFormatted
        ? firstDateFormatted
        : `${firstDateFormatted} — ${lastDateFormatted}`
      : 'My Thoughts & Memories';

  // 4. Generate Table of Contents HTML
  const tocRows = sortedEntries
    .map((entry, index) => {
      const displayDate = formatDisplayDate(entry.date, currentLocale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const moodInfo = entry.mood ? (MOOD_META[entry.mood] || DEFAULT_MOOD_META) : DEFAULT_MOOD_META;
      const moodLabel = entry.mood && dict.moods[entry.mood] ? dict.moods[entry.mood] : moodInfo.label;
      const plain = htmlToPlainText(entry.content || '');
      const snippet = plain.length > 70 ? plain.substring(0, 70) + '…' : plain || 'Daily reflection note';
      const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;

      return `
        <div class="toc-row">
          <div class="toc-col-idx">#${index + 1}</div>
          <div class="toc-col-date">
            <span class="toc-date-text">${displayDate}</span>
            <span class="toc-snippet">${escapeHtml(snippet)}</span>
          </div>
          <div class="toc-col-mood">
            <span class="toc-mood-pill">${moodInfo.emoji} ${escapeHtml(moodLabel)}</span>
          </div>
          <div class="toc-col-words">${words} words</div>
        </div>
      `;
    })
    .join('');

  // 5. Generate Entries HTML
  const entriesHtml = sortedEntries
    .map((entry, index) => {
      const fullDate = formatDisplayDate(entry.date, currentLocale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const moodInfo = entry.mood ? (MOOD_META[entry.mood] || DEFAULT_MOOD_META) : DEFAULT_MOOD_META;
      const moodLabel = entry.mood && dict.moods[entry.mood] ? dict.moods[entry.mood] : moodInfo.label;
      const plain = htmlToPlainText(entry.content || '');
      const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;

      const promptHtml = entry.promptUsed
        ? `
        <div class="entry-prompt-banner">
          <span class="prompt-icon">✨</span>
          <span class="prompt-text">“${escapeHtml(entry.promptUsed)}”</span>
        </div>
      `
        : '';

      const contentHtml = entry.content && entry.content.trim() !== '<p><br></p>'
        ? entry.content
        : '<p class="empty-entry-text"><em>No writing recorded for this day.</em></p>';

      return `
        <section class="book-entry-page">
          <!-- Page Header -->
          <header class="entry-header">
            <div class="entry-header-left">
              <span class="entry-badge-idx">Entry #${index + 1}</span>
              <h2 class="entry-date-title">${fullDate}</h2>
            </div>
            <div class="entry-header-right">
              <span class="entry-mood-badge">
                <span class="mood-em">${moodInfo.emoji}</span>
                <span class="mood-lbl">${escapeHtml(moodLabel)}</span>
              </span>
              <span class="entry-words-badge">${words} words</span>
            </div>
          </header>

          ${promptHtml}

          <!-- Ruled Paper Body -->
          <article class="entry-content journal-rich-content">
            ${contentHtml}
          </article>

          <!-- Page Footer -->
          <footer class="entry-footer">
            <div class="footer-left">DailyDiary • 100% Private Zero-Server Journal</div>
            <div class="footer-right">${entry.date}</div>
          </footer>
        </section>
      `;
    })
    .join('');

  // 6. Assemble complete standalone HTML
  const fullHtml = `<!DOCTYPE html>
<html lang="${escapeHtml(currentLocale)}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(coverConfig.title || 'My Daily Diary')} - Full Journal Book</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Playfair Display', Georgia, serif;
      color: #1C1917;
      background-color: #F5F2EB;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* On-Screen Sticky Action Bar (Hidden during Print) */
    .screen-action-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #1C1917;
      color: #F5F5F4;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .bar-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bar-icon {
      font-size: 20px;
    }

    .bar-title {
      font-weight: 700;
      font-size: 14px;
      color: #FFFFFF;
    }

    .bar-subtitle {
      font-size: 11px;
      color: #A8A29E;
    }

    .bar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-print-primary {
      background: #95E1D3;
      color: #0F172A;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(149, 225, 211, 0.4);
      transition: all 0.15s ease;
    }

    .btn-print-primary:hover {
      background: #78CBBF;
      transform: translateY(-1px);
    }

    .btn-close {
      background: #292524;
      color: #E7E5E4;
      font-weight: 600;
      font-size: 12px;
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px solid #44403C;
      cursor: pointer;
    }

    .btn-close:hover {
      background: #3B3633;
    }

    /* Container for pages */
    .book-wrapper {
      max-width: 850px;
      margin: 30px auto 60px;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    /* ========================================================================= */
    /* 1. COVER PAGE                                                             */
    /* ========================================================================= */
    .book-cover-page {
      position: relative;
      width: 100%;
      min-height: 1050px;
      height: 100vh;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 50px;
      color: ${coverTextColor};
      ${coverBg}
      page-break-after: always;
      break-after: page;
    }

    /* Left spine crease */
    .spine-crease {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 36px;
      background: linear-gradient(to right, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.12) 50%, transparent 100%);
      pointer-events: none;
    }

    /* Inner dashed border frame */
    .cover-border-frame {
      position: absolute;
      inset: 28px;
      border: 2px dashed ${coverAccentBorder};
      border-radius: 14px;
      pointer-events: none;
    }

    /* Bookmark Ribbon */
    .bookmark-ribbon {
      position: absolute;
      top: 0;
      right: 48px;
      width: 28px;
      height: 64px;
      background: #F38181;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
      z-index: 5;
    }

    .bookmark-ribbon::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 0;
      border-left: 14px solid transparent;
      border-right: 14px solid transparent;
      border-bottom: 10px solid rgba(0, 0, 0, 0.2);
    }

    .cover-top-section {
      position: relative;
      z-index: 2;
      text-align: center;
      padding-top: 20px;
    }

    .monogram-badge {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 700;
      border: 2px solid ${coverAccentBorder};
      background: rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .cover-center-section {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 0 30px;
      margin: auto 0;
    }

    .cover-title {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 1.15;
      margin-bottom: 16px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .cover-divider {
      width: 80px;
      height: 2px;
      background: currentColor;
      margin: 0 auto 16px;
      opacity: 0.6;
    }

    .cover-subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.85;
    }

    .cover-bottom-section {
      position: relative;
      z-index: 2;
      text-align: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .cover-stats-pill {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .cover-date-range {
      font-size: 11px;
      opacity: 0.75;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ========================================================================= */
    /* 2. TABLE OF CONTENTS                                                      */
    /* ========================================================================= */
    .book-toc-page {
      background: #FDFBF7;
      border-radius: 16px;
      padding: 50px 45px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      page-break-after: always;
      break-after: page;
      min-height: 950px;
    }

    .toc-header {
      border-bottom: 2px solid #E7E5E4;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .toc-title {
      font-size: 28px;
      font-weight: 700;
      color: #1C1917;
    }

    .toc-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #78716C;
    }

    .toc-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toc-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #F5F2EB;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
    }

    .toc-col-idx {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #95E1D3;
      background: #1C1917;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
    }

    .toc-col-date {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .toc-date-text {
      font-weight: 700;
      color: #1C1917;
      font-size: 13px;
    }

    .toc-snippet {
      font-size: 11px;
      color: #78716C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 380px;
    }

    .toc-col-mood {
      flex-shrink: 0;
    }

    .toc-mood-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      font-size: 11px;
      font-weight: 600;
      color: #292524;
    }

    .toc-col-words {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #A8A29E;
      min-width: 65px;
      text-align: right;
    }

    /* ========================================================================= */
    /* 3. JOURNAL ENTRY PAGES                                                    */
    /* ========================================================================= */
    .book-entry-page {
      background: #FDFBF7;
      border-radius: 16px;
      padding: 50px 45px 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      page-break-after: always;
      break-after: page;
      min-height: 950px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E7E5E4;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .entry-badge-idx {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #0F766E;
      background: #CCFBF1;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .entry-date-title {
      font-size: 24px;
      font-weight: 700;
      color: #1C1917;
      letter-spacing: -0.5px;
    }

    .entry-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .entry-mood-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #EAFFD0;
      border: 1px solid #95E1D3;
      font-size: 11px;
      font-weight: 600;
      color: #134E48;
    }

    .entry-words-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #78716C;
      background: #F5F2EB;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .entry-prompt-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #FEF9C3;
      border-left: 3px solid #FACC15;
      border-radius: 6px;
      font-style: italic;
      font-size: 13px;
      color: #713F12;
      margin-bottom: 20px;
    }

    /* Ruled paper body styling */
    .entry-content {
      flex: 1;
      font-size: 16px;
      line-height: 32px;
      color: #292524;
      background-image: repeating-linear-gradient(
        transparent,
        transparent 31px,
        #E7E5E4 31px,
        #E7E5E4 32px
      );
      padding: 0 4px 20px;
      min-height: 500px;
    }

    /* Rich content typography */
    .journal-rich-content h1,
    .journal-rich-content h2,
    .journal-rich-content h3 {
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      color: #1C1917;
      margin: 16px 0 8px;
      line-height: 1.3;
    }

    .journal-rich-content h1 { font-size: 24px; }
    .journal-rich-content h2 { font-size: 20px; }
    .journal-rich-content h3 { font-size: 18px; }

    .journal-rich-content p {
      margin-bottom: 12px;
    }

    .journal-rich-content blockquote {
      border-left: 3px solid #F38181;
      padding-left: 14px;
      font-style: italic;
      color: #57534E;
      margin: 14px 0;
    }

    .journal-rich-content ul,
    .journal-rich-content ol {
      padding-left: 24px;
      margin: 10px 0;
    }

    .journal-rich-content li {
      margin: 4px 0;
    }

    .journal-rich-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .empty-entry-text {
      color: #A8A29E;
      font-style: italic;
      padding-top: 10px;
    }

    .entry-footer {
      border-top: 1px solid #E7E5E4;
      padding-top: 14px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #A8A29E;
    }

    /* ========================================================================= */
    /* PRINT MEDIA SPECIFICATIONS                                                */
    /* ========================================================================= */
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      body {
        background: #FFFFFF !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .no-print, .screen-action-bar {
        display: none !important;
      }

      .book-wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        gap: 0 !important;
      }

      .book-cover-page {
        border-radius: 0 !important;
        box-shadow: none !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        padding: 50mm 30mm 40mm !important;
        page-break-after: always !important;
        break-after: page !important;
      }

      .cover-border-frame {
        inset: 15mm !important;
      }

      .book-toc-page, .book-entry-page {
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 25mm 20mm !important;
        min-height: 100vh !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <!-- Floating Screen Action Bar (Hidden during Print) -->
  <div class="screen-action-bar no-print">
    <div class="bar-title-wrap">
      <span class="bar-icon">📕</span>
      <div>
        <div class="bar-title">${escapeHtml(coverConfig.title || 'My Daily Diary')} • PDF Book</div>
        <div class="bar-subtitle">${totalEntries} Entries with Custom Cover • Ready to Print / Save</div>
      </div>
    </div>
    <div class="bar-actions">
      <button type="button" class="btn-print-primary" onclick="window.print()">
        <span>🖨️</span>
        <span>Save as PDF / Print</span>
      </button>
      <button type="button" class="btn-close" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <main class="book-wrapper">
    <!-- 1. FULL BOOK COVER -->
    <div class="book-cover-page">
      <div class="spine-crease"></div>
      <div class="cover-border-frame"></div>
      <div class="bookmark-ribbon"></div>

      <div class="cover-top-section">
        <div class="monogram-badge">
          ${escapeHtml(coverConfig.monogram || 'D')}
        </div>
      </div>

      <div class="cover-center-section">
        <h1 class="cover-title">${escapeHtml(coverConfig.title || 'My Daily Diary')}</h1>
        <div class="cover-divider"></div>
        <p class="cover-subtitle">${escapeHtml(coverConfig.subtitle || '100% Private Browser Journal')}</p>
      </div>

      <div class="cover-bottom-section">
        <div class="cover-stats-pill">
          ${totalEntries} Journal Entries • ${totalWords} Words
        </div>
        <div class="cover-date-range">
          ${escapeHtml(dateRangeStr)}
        </div>
      </div>
    </div>

    <!-- 2. TABLE OF CONTENTS -->
    ${
      sortedEntries.length > 1
        ? `
      <div class="book-toc-page">
        <header class="toc-header">
          <h2 class="toc-title">Table of Contents</h2>
          <div class="toc-meta">${totalEntries} Entries • ${totalWords} Total Words</div>
        </header>
        <div class="toc-list">
          ${tocRows}
        </div>
      </div>
    `
        : ''
    }

    <!-- 3. ALL JOURNAL ENTRIES -->
    ${entriesHtml}
  </main>

  <script>
    // Automatically trigger print dialog on page load
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 600);
    });
  </script>
</body>
</html>`;

  // 7. Open print window or fall back to invisible iframe
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  } else {
    // Fallback: If popup blocker blocked window.open, use hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(fullHtml);
    iframe.contentDocument?.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 60000);
    }, 600);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

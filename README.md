# DailyDiary | Free 100% Private Zero-Server Online Journal

[![GitHub Pages Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-success?style=flat-square&logo=github)](https://daily-diary.github.io)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Zero--Server-emerald?style=flat-square&logo=shield)](https://daily-diary.github.io)
[![Cryptography](https://img.shields.io/badge/Security-AES--GCM%20256--bit-blue?style=flat-square&logo=keycdn)](https://daily-diary.github.io)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-amber?style=flat-square&logo=buymeacoffee)](https://buymeacoffee.com/kisharadilz)

> An ultra-minimal, 100% client-side daily journaling and mindset reflection web application built with **Astro** and **React**. All entries, mood logs, and daily streaks are stored strictly in the user's browser via LocalStorage with optional Web Crypto API (`AES-GCM` 256-bit + `PBKDF2`) PIN lock. Zero servers, zero cloud uploads, and complete privacy.

---

## ✨ Key Features

- 🛡️ **100% Client-Side Privacy (Zero Servers)**: No accounts, no logins, no cloud databases, and zero tracking. Your private thoughts never leave your device.
- 🔐 **Web Crypto API AES-GCM PIN Lock**: Optional client-side 4-digit PIN encryption. PBKDF2 key derivation (100,000 iterations) and 256-bit AES-GCM lock prevent snooping eyes on shared computers.
- 🎨 **Browser Color Palette & Typography Configurator**: Select from 8 editorial luxury presets (Warm Sage, Terracotta Linen, Rosewood Blush, Midnight Indigo, Pine & Moss, Charcoal Minimal, Golden Amber, Lavender Calm) or customize hex colors and fonts (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`) directly in the browser!
- 🧘 **Distraction-Free Zen Mode**: One-click Zen mode that conceals all navigation and sidebars for an expansive, uninterrupted blank page.
- 🌿 **1-Tap Daily Mood & Mindset Prompts**: Log your daily emotional energy (Calm, Focused, Grateful, Happy, Tired, Energized, Reflective, Inspired) and receive curated psychological reflection prompts to soothe anxiety.
- 🔥 **30-Day Consistency Streak Heatmap**: Real-time visual progress dots, current streak tracking, personal best streak records, and celebratory confetti milestones.
- 📦 **Universal Data Ownership**:
  - Export single notes as Markdown (`.md`), plain text (`.txt`), or print-ready PDF view.
  - Complete JSON backup and instant file restoration.
- 🌐 **7-Language i18n Architecture**:
  - English (`en`, US)
  - Español (`es`, ES)
  - Português (`pt`, BR)
  - Deutsch (`de`, DE)
  - Français (`fr`, FR)
  - 日本語 (`ja`, JP)
  - 简体中文 (`zh`, CN)
- 🚀 **Peak Technical SEO**: Fully static generation (SSG) with `WebApplication`, `HowTo`, and `FAQPage` JSON-LD schemas, alternate hreflang tags, canonical URLs, Open Graph, and Twitter Cards.

---

## 🛠️ Tech Stack

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation for instant load times)
- **UI Islands**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom CSS custom properties
- **Typography**: Playfair Display (Serif), Plus Jakarta Sans (Clean Modern Sans), JetBrains Mono (Monospace)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animation & Delight**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Client Cryptography**: Native Web Crypto API (`window.crypto.subtle`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18.0.0` or higher
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/daily-diary/daily-diary.github.io.git

# Navigate to project directory
cd daily-diary.github.io

# Install dependencies
npm install
```

### Development

```bash
# Start local development server
npm run dev
```

Visit `http://localhost:4321` in your browser.

### Build for Production

```bash
# Type check and build static site
npm run build

# Preview static build locally
npm run preview
```

---

## ☕ Support the Developer

If DailyDiary brings peace, clarity, or daily consistency to your life, consider supporting continued open-source development:

👉 **[Buy Me a Coffee](https://buymeacoffee.com/kisharadilz)**

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

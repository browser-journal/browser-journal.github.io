const fs = require('fs');
const sharp = require('sharp');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0C0A09" />
      <stop offset="50%" stop-color="#1C1917" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F38181" />
      <stop offset="35%" stop-color="#FCE38A" />
      <stop offset="70%" stop-color="#EAFFD0" />
      <stop offset="100%" stop-color="#95E1D3" />
    </linearGradient>
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F38181" />
      <stop offset="40%" stop-color="#FCE38A" />
      <stop offset="75%" stop-color="#EAFFD0" />
      <stop offset="100%" stop-color="#95E1D3" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Subtle Ambient Glow -->
  <circle cx="1050" cy="150" r="300" fill="#95E1D3" opacity="0.08" />
  <circle cx="150" cy="480" r="350" fill="#F38181" opacity="0.06" />

  <!-- Decorative Inner Border -->
  <rect x="30" y="30" width="1140" height="570" rx="24" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.4" />

  <!-- Left: Stylized Book Graphic -->
  <g transform="translate(90, 95)" filter="url(#shadow)">
    <!-- Book Cover -->
    <rect x="0" y="0" width="320" height="440" rx="20" fill="url(#bookGrad)" />
    <!-- Spine Crease -->
    <rect x="0" y="0" width="32" height="440" rx="8" fill="#000000" opacity="0.25" />
    <!-- Inner Gold Frame -->
    <rect x="20" y="20" width="280" height="400" rx="14" fill="none" stroke="#1C1917" stroke-width="2" stroke-dasharray="6,4" opacity="0.35" />
    <!-- Satin Ribbon -->
    <rect x="240" y="0" width="26" height="65" fill="#F38181" />
    <polygon points="240,65 253,52 266,65" fill="#1C1917" opacity="0.25" />
    <!-- Monogram Circle -->
    <circle cx="160" cy="150" r="42" fill="#1C1917" opacity="0.15" />
    <circle cx="160" cy="150" r="36" fill="none" stroke="#1C1917" stroke-width="2" opacity="0.4" />
    <text x="160" y="163" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#1C1917" text-anchor="middle">B</text>
    <!-- Book Title on Cover -->
    <text x="160" y="250" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#1C1917" text-anchor="middle" letter-spacing="2">BROWSER</text>
    <text x="160" y="278" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#1C1917" text-anchor="middle" letter-spacing="2">JOURNAL</text>
    <line x1="120" y1="298" x2="200" y2="298" stroke="#1C1917" stroke-width="2" opacity="0.4" />
    <text x="160" y="325" font-family="monospace" font-size="10" fill="#1C1917" text-anchor="middle" letter-spacing="1">100% PRIVATE</text>
  </g>

  <!-- Right: Copy & Value Proposition -->
  <g transform="translate(480, 110)">
    <!-- Trust Pill -->
    <rect x="0" y="0" width="370" height="36" rx="18" fill="#95E1D3" opacity="0.15" />
    <rect x="0" y="0" width="370" height="36" rx="18" fill="none" stroke="#95E1D3" stroke-width="1.5" opacity="0.5" />
    <circle cx="20" cy="18" r="5" fill="#95E1D3" />
    <text x="35" y="23" font-family="sans-serif" font-size="12" font-weight="bold" fill="#95E1D3" letter-spacing="1">100% ZERO-SERVER PRIVATE JOURNAL</text>

    <!-- Main Title -->
    <text x="0" y="95" font-family="Georgia, serif" font-size="56" font-weight="bold" fill="#FFFFFF" letter-spacing="-1">
      Browser Journal
    </text>

    <!-- Tagline -->
    <text x="0" y="140" font-family="sans-serif" font-size="22" font-weight="600" fill="url(#accent)">
      Free 100% Private Online Diary &amp; Digital Notebook
    </text>

    <!-- Bullets -->
    <g transform="translate(0, 175)">
      <g transform="translate(0, 0)">
        <text x="0" y="20" font-family="sans-serif" font-size="17" fill="#95E1D3">✓</text>
        <text x="25" y="20" font-family="sans-serif" font-size="17" font-weight="500" fill="#E7E5E4">Zero servers, zero accounts — saved directly in your browser</text>
      </g>
      <g transform="translate(0, 36)">
        <text x="0" y="20" font-family="sans-serif" font-size="17" fill="#95E1D3">✓</text>
        <text x="25" y="20" font-family="sans-serif" font-size="17" font-weight="500" fill="#E7E5E4">Military-grade 256-bit AES-GCM PIN encryption lock</text>
      </g>
      <g transform="translate(0, 72)">
        <text x="0" y="20" font-family="sans-serif" font-size="17" fill="#95E1D3">✓</text>
        <text x="25" y="20" font-family="sans-serif" font-size="17" font-weight="500" fill="#E7E5E4">Aesthetic 3D book physics, covers &amp; pastel themes</text>
      </g>
      <g transform="translate(0, 108)">
        <text x="0" y="20" font-family="sans-serif" font-size="17" fill="#95E1D3">✓</text>
        <text x="25" y="20" font-family="sans-serif" font-size="17" font-weight="500" fill="#E7E5E4">Download full journal book with cover as PDF or Markdown</text>
      </g>
    </g>

    <!-- Bottom URL Callout -->
    <g transform="translate(0, 350)">
      <rect x="0" y="0" width="320" height="44" rx="12" fill="#FFFFFF" opacity="0.08" />
      <text x="20" y="28" font-family="monospace" font-size="16" font-weight="bold" fill="#FCE38A">
        browser-journal.github.io
      </text>
    </g>
  </g>
</svg>`;

fs.writeFileSync('public/og-image.svg', svg);
sharp(Buffer.from(svg))
  .png({ quality: 95 })
  .toFile('public/og-image.png')
  .then(() => {
    console.log('Successfully generated public/og-image.png and public/og-image.svg');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error generating image:', err);
    process.exit(1);
  });

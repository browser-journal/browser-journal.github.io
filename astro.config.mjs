import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://daily-diary.github.io',
  trailingSlash: 'never',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: true,
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'de', 'fr', 'ja', 'zh'],
    routing: {
      prefixDefaultLocale: false,
      strategy: 'pathname',
    },
  },
});

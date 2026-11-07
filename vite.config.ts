import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

// Each page is its own HTML entry so GitHub Pages can serve /cards/, /admin/ and
// /privacy/ as plain directories without SPA routing tricks.
const pages: Record<string, string> = {
  main: 'index.html',
  cards: 'cards/index.html',
  admin: 'admin/index.html',
  privacy: 'privacy/index.html',
};
// /design/ (the annotated home page for front-end designers) needs the in-browser mock backend to
// show the result card, so it is built wherever VITE_API_MODE is not `live` (the GitHub Pages
// preview, local runs) and never into a build that talks to the real API (staging, production).
if (process.env.VITE_API_MODE !== 'live') {
  pages.design = 'design/index.html';
  pages['design-trial'] = 'design-trial/index.html';
  pages['design-trial-2'] = 'design-trial-2/index.html';
  pages['design-trial-3'] = 'design-trial-3/index.html';
}

export default defineConfig({
  // GitHub Pages project sites live under /<repo>/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(Object.entries(pages).map(([name, file]) => [name, root + file])),
    },
  },
  // Keep the dependency scanner away from the design prototype folder.
  optimizeDeps: {
    entries: Object.values(pages),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'functions/**/*.test.ts', 'scripts/**/*.test.mjs'],
  },
});

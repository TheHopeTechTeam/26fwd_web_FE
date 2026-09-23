import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

// Each page is its own HTML entry so GitHub Pages can serve /cards/, /admin/ and
// /privacy/ as plain directories without SPA routing tricks.
const pages = {
  main: 'index.html',
  cards: 'cards/index.html',
  admin: 'admin/index.html',
  privacy: 'privacy/index.html',
};

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
    include: ['src/**/*.test.ts'],
  },
});

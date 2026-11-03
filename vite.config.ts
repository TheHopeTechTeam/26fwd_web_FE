import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { siteIndexingHeaders } from './scripts/site-indexing.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));

// Rewrites the built _headers so search engines may index the custom domain, only when the build
// runs with SITE_INDEXING=allow (the production launch); see scripts/site-indexing.mjs.
function siteIndexing(): Plugin {
  let outDir = '';
  return {
    name: 'site-indexing',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const file = resolve(outDir, '_headers');
      writeFileSync(file, siteIndexingHeaders(readFileSync(file, 'utf8'), process.env.SITE_INDEXING));
    },
  };
}

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
  plugins: [react(), siteIndexing()],
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

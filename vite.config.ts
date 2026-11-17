import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Cloudflare Pages reads security headers from public/_headers. Reuse the same
// file for `vite preview` so the built site can be checked locally under the
// exact policy it will ship with.
function pagesHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  let inSiteWideBlock = false;
  for (const line of readFileSync('public/_headers', 'utf8').split('\n')) {
    if (/^\S/.test(line)) {
      // An unindented line starts a new rule. Only the site-wide one applies locally.
      inSiteWideBlock = line.trim() === '/*';
      continue;
    }
    const match = line.match(/^\s+([A-Za-z-]+):\s*(.+)$/);
    if (inSiteWideBlock && match?.[1] && match[2]) headers[match[1]] = match[2].trim();
  }
  return headers;
}

export default defineConfig({
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, headers: pagesHeaders() },
  build: {
    target: 'es2022',
    // Never inline fonts or images as data: URIs; the CSP only allows same-origin fonts.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: 'index.html',
        kit: 'kit/index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html',
        refunds: 'refunds/index.html',
      },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});

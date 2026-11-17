import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import pkg from './package.json' with { type: 'json' };

/** Emits sw.js with a precache list of every built file, so the game runs offline. */
function serviceWorker(): Plugin {
  const walk = (dir: string, root: string): string[] => {
    try {
      return readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p, root) : [relative(root, p).split('\\').join('/')];
      });
    } catch {
      return [];
    }
  };
  return {
    name: 'castaway-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const pub = walk('public', 'public').filter((f) => !f.startsWith('.'));
      const files = ['./', ...built.filter((f) => f !== 'index.html'), ...pub];
      const html = bundle['index.html'];
      const htmlSrc = html && html.type === 'asset' ? String(html.source) : '';
      const hash = createHash('sha1').update(files.join('|') + htmlSrc).digest('hex').slice(0, 10);
      const source = `const CACHE = 'castaway-${hash}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('castaway-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [preact(), serviceWorker()],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  server: { host: true, port: 5183 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as never);

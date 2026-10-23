// GymTracker service worker: caches the app shell so the app opens without internet.
// - Pages (navigations): network first, falling back to the cached index.html (SPA).
// - Built assets (/assets/*, hashed): cache first. Other same-origin files (icons, mascot images): stale-while-revalidate.
// - API requests (another origin) are never handled here; the app caches their data in IndexedDB.
const CACHE = 'gymtracker-shell-v1';

// Cache index.html and the bundles it references, so the very first visit already works offline later
async function cacheShell() {
  const cache = await caches.open(CACHE);
  const res = await fetch('/', { cache: 'no-cache' });
  if (!res.ok) return;
  const html = await res.clone().text();
  await cache.put('/', res);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]);
  await cache.addAll([...new Set(assets)]);
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShell().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          // A new deploy: keep the fresh shell and its bundles for the next offline start
          const cache = await caches.open(CACHE);
          await cache.put('/', res.clone());
          cacheShell().catch(() => {});
        }
        return res;
      } catch {
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    if (hit) { fresh.catch(() => {}); return hit; }
    return fresh;
  })());
});

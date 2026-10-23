// GymTracker service worker: caches the app shell so the app opens without internet.
// - Pages (navigations): network first, falling back to the cached index.html (SPA).
// - Built assets (/assets/*, hashed): cache first. Other same-origin files (icons, mascot images): stale-while-revalidate.
// - API requests (another origin) are never handled here; the app caches their data in IndexedDB.
// - Requests made with cache: 'no-store' (the refresh button's version check) always go to the network.
// - Web Push: shows the rest timer's "Zacznij serię!" notification; a tap opens the app.
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
  if (req.method !== 'GET' || req.cache === 'no-store') return;
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

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* not JSON */ }
  event.waitUntil((async () => {
    const title = data.title || 'GymTracker';
    const options = {
      body: data.body || '', tag: data.tag || 'rest-timer', renotify: true,
      icon: '/icons/app-192.png', vibrate: [200, 100, 200],
    };
    await self.registration.showNotification(title, options);
    // The app is open and visible: it already shows the ready state, so the banner is closed right away
    // (a push must always show a notification, otherwise the browser may revoke the subscription)
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.some(w => w.visibilityState === 'visible')) {
      (await self.registration.getNotifications({ tag: options.tag })).forEach(n => n.close());
    }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find(w => 'focus' in w);
    if (open) return open.focus();
    return self.clients.openWindow('/plans');
  })());
});

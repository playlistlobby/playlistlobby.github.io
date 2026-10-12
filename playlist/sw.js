// Playlist service worker: makes the site installable as an app, lets the page show alerts, and keeps a copy of the
// files that rarely change, so phones don't download them again on every visit.
//  - the page itself: always fresh from the network (the saved copy is only used when there's no connection)
//  - pictures, sounds and icons (assets/): shown from the saved copy at once, and refreshed in the background
//  - the database code (a fixed version) and the fonts: saved once, reused after that
const CACHE = 'sab-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); // old saved copies go
  await self.clients.claim();
})()));

const cacheFirst = async req => {
  const c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
};
const cacheThenRefresh = async (req, e) => {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const fresh = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
  if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
  return fresh;
};
const networkFirst = async req => {
  const c = await caches.open(CACHE);
  try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
  catch (err) { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; throw err; }
};

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) return e.respondWith(networkFirst(req));
    if (url.pathname.includes('/assets/')) return e.respondWith(cacheThenRefresh(req, e));
    return; // anything else (manifest, this file): straight from the network
  }
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) return e.respondWith(cacheFirst(req)); // a fixed version: never changes
  if (url.hostname === 'fonts.gstatic.com') return e.respondWith(cacheFirst(req));
  if (url.hostname === 'fonts.googleapis.com') return e.respondWith(cacheThenRefresh(req, e));
  // the database connection and everything else: left to the browser
});

// tapping an alert brings Playlist to the front
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});

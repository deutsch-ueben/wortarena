/* Wortarena: Offline-Modus. Speichert das Spiel auf dem Gerät, damit es auch ohne Internet startet.
   Beim Öffnen mit Internet wird immer zuerst die neueste Version geholt. Es wird nichts verschickt. */
const CACHE = 'wortarena-v2';
const DATEIEN = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => Promise.all(DATEIEN.map(d => c.add(d).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('wortarena-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    /* Seite: zuerst aus dem Netz (neueste Version), ohne Netz aus dem Speicher */
    ev.respondWith(fetch(req).then(antwort => {
      const kopie = antwort.clone();
      caches.open(CACHE).then(c => c.put('index.html', kopie)).catch(() => null);
      return antwort;
    }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  /* Symbole und Manifest: aus dem Speicher, sonst aus dem Netz */
  ev.respondWith(caches.match(req).then(r => r || fetch(req)));
});

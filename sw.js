// Souquez ! : cache hors ligne. Renommer CACHE à chaque version pour forcer la mise à jour.
// Règle du hub : ne supprimer QUE les caches de Souquez (même adresse que le hub et les autres jeux).
const CACHE = 'souquez-0.7.6';
const FILES = ['./', 'index.html', 'css/style.css', 'ks-back.js', 'ks-studio.js',
  'js/donnees.js', 'js/textes.js', 'js/sauvegarde.js', 'js/audio.js', 'js/interface.js', 'js/partie.js', 'js/ecrans.js', 'js/rendu.js', 'js/main.js',
  'koa-music.mp3', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('souquez') && k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Réseau d'abord (pour recevoir les nouvelles versions), cache si hors ligne
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});

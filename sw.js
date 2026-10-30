/* Офлайн-кэш листа викинга. При обновлении файлов поменяй номер версии. */
const CACHE = "aov-sheet-v13";
const CORE = ["./", "index.html", "app.js", "data.js", "style.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "fonts/cormorant-sc-cyrillic-500-normal.woff2","fonts/cormorant-sc-cyrillic-700-normal.woff2","fonts/cormorant-sc-latin-500-normal.woff2","fonts/cormorant-sc-latin-700-normal.woff2","fonts/cormorant-unicase-cyrillic-700-normal.woff2","fonts/cormorant-unicase-latin-700-normal.woff2","fonts/marck-script-cyrillic-400-normal.woff2","fonts/marck-script-latin-400-normal.woff2","fonts/noto-sans-runic-runic-400-normal.woff2","fonts/old-standard-tt-cyrillic-400-italic.woff2","fonts/old-standard-tt-cyrillic-400-normal.woff2","fonts/old-standard-tt-cyrillic-700-normal.woff2","fonts/old-standard-tt-latin-400-italic.woff2","fonts/old-standard-tt-latin-400-normal.woff2","fonts/old-standard-tt-latin-700-normal.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (url.pathname.includes("/fonts/")) { e.respondWith(caches.match(req).then(r => r || fetch(req))); return; }
  /* сеть первой, чтобы обновления доходили; без сети — из кэша */
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match("index.html"))));
});

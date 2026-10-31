// Réseau d'abord, en revalidant le cache HTTP (pour toujours avoir la dernière version), cache en secours hors ligne.
const CACHE = "marcel-v6";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co")) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request)));
});

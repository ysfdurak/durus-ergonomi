// Duruş — çevrimdışı çalışma. Yalnız bu sitenin kendi dosyalarını önbelleğe alır; başka hiçbir adrese istek göndermez.
// Görüntüler, videolar ve kayıtlar zaten tarayıcıda kalır, önbelleğe girmez.
// Strateji: önce ağ (her zaman en yeni sürüm), ağ yoksa önbellek. Otomatik nokta bulma dosyaları (lib/pose, ~25 MB)
// baştan indirilmez; ilk kullanımda önbelleğe girer ve sonrasında internetsiz de çalışır.
// Yeni sürümde CACHE adını değiştir; eski önbellek "activate" adımında silinir.
const CACHE = 'durus-2026-11-20-girdi04';
const FILES = ['/', '/index.html', '/en/', '/en/index.html', '/favicon.svg', '/lib/fonts/fonts.css', '/lib/exceljs.min.js', '/lib/pdfmake.min.js', '/lib/vfs_fonts.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('durus-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || r.headers.has('range')) return;
  e.respondWith(
    fetch(r).then((res) => {
      if (res.ok && res.status === 200) { const kopya = res.clone(); caches.open(CACHE).then((c) => c.put(r, kopya)); }
      return res;
    }).catch(async () => {
      const c = await caches.match(r, { ignoreSearch: true });
      if (c) return c;
      if (r.mode === 'navigate') return caches.match(u.pathname.startsWith('/en/') ? '/en/index.html' : '/index.html');
      return Response.error();
    })
  );
});

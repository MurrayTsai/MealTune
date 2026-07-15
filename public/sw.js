 const CACHE_NAME = 'mealtune-v2';
 const ASSETS = [
   '/',
   '/index.html',
   '/manifest.json'
 ];

 self.addEventListener('install', (event) => {
   event.waitUntil(
     caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
   );
   self.skipWaiting();
 });

 self.addEventListener('activate', (event) => {
   event.waitUntil(
     caches.keys().then(keys =>
       Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
     )
   );
   self.clients.claim();
 });

 self.addEventListener('fetch', (event) => {
   if (event.request.method !== 'GET') return;

   const url = new URL(event.request.url);
   // Only handle same-origin requests
   if (url.origin !== self.location.origin) return;

   // Cache-first for static assets (JS, CSS, images, fonts)
   const isStaticAsset = /\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|ico)$/.test(url.pathname);

   if (isStaticAsset) {
     event.respondWith(
       caches.match(event.request).then(cached => {
         if (cached) return cached;
         return fetch(event.request).then(response => {
           const clone = response.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
           return response;
         }).catch(() => cached);
       })
     );
     return;
   }

   // Network-first for navigation requests and dynamic content
   event.respondWith(
     fetch(event.request).then(response => {
       const clone = response.clone();
       caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
       return response;
     }).catch(() =>
       caches.match(event.request).then(cached => cached || caches.match('/index.html'))
     )
   );
 });

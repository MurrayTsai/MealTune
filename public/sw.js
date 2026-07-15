 const CACHE_NAME = 'mealtune-v1';
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
   event.respondWith(
     caches.match(event.request).then(cached => {
       const fetchPromise = fetch(event.request).then(response => {
         const clone = response.clone();
         caches.open(CACHE_NAME).then(cache => {
           if (event.request.url.startsWith(self.location.origin)) {
             cache.put(event.request, clone);
           }
         });
         return response;
       }).catch(() => cached);
       return cached || fetchPromise;
     })
   );
 });

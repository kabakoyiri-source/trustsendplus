const VERSION = /*__BUILD_ID__*/ 'development';
const CACHE = 'trust-concept-' + VERSION;
const ASSETS = /*__PWA_ASSETS__*/ [];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && (k.startsWith('trust-concept-') || k.startsWith('ubs-bank-'))).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
 if(e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
 e.respondWith(fetch(e.request).catch(async () => (await caches.match(e.request)) || (e.request.mode === 'navigate' ? caches.match('/index.html') : Response.error())));
});

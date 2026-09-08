/* ==========================================
   SERVICE WORKER - MBL ARG PWA
   ========================================== */

const CACHE_NAME = 'mblarg-pwa-v1';

// Lista completa de recursos para almacenamiento en caché local
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Evento de Instalación: Pre-cachea los archivos del proyecto
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Evento de Activación: Limpia cachés antiguas en actualizaciones
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Evento Fetch: Intercepta peticiones de red y responde desde caché si no hay conexión
self.addEventListener('fetch', (event) => {
    // Ignorar solicitudes que no sean GET o que pertenezcan a Firebase SDK / Apis externas
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('identitytoolkit.googleapis.com') ||
        event.request.url.includes('firebasestorage.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(() => {
                    // Retorno de contingencia offline si el recurso no está cacheado
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

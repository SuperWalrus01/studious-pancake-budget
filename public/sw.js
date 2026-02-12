// Service Worker for Budget App PWA
const CACHE_NAME = 'budget-app-v1';
const STATIC_CACHE = 'budget-static-v1';
const DYNAMIC_CACHE = 'budget-dynamic-v1';

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests - network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response and cache it
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // All other requests - cache first, network fallback
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request)
                .then((response) => {
                    // Don't cache non-GET requests or opaque responses
                    if (request.method !== 'GET' || !response || response.status !== 200) {
                        return response;
                    }

                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });

                    return response;
                })
                .catch(() => {
                    // Return offline page for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/offline');
                    }
                });
        })
    );
});

// Background sync event for offline transactions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncOfflineTransactions());
    }
});

async function syncOfflineTransactions() {
    // This will be triggered when connection is restored
    // The actual sync logic will be in the offline queue manager
    console.log('[SW] Syncing offline transactions...');

    // Notify all clients to sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_TRANSACTIONS' });
    });
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || '💰 Budget Update';
    const options = {
        body: data.body || 'Check your spending today',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: data.url || '/',
        vibrate: [200, 100, 200],
        tag: data.tag || 'budget-notification',
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();

    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if app not open
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Periodic background sync for notifications (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync triggered:', event.tag);

    if (event.tag === 'daily-summary') {
        event.waitUntil(sendDailySummaryNotification());
    }
});

async function sendDailySummaryNotification() {
    // This would fetch today's spending and send a notification
    console.log('[SW] Sending daily summary notification');

    // For now, just send a reminder
    await self.registration.showNotification('💰 Daily Budget Check', {
        body: 'Have you logged all your expenses today?',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'daily-reminder',
        requireInteraction: false,
    });
}

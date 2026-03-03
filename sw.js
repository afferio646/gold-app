// Service Worker for Goldmorr PWA
const CACHE_NAME = 'goldmorr-v7-member-suite';
const ASSETS = [
    '/',
    '/index.html',
    '/admin.html',
    '/show_links.html',
    '/member.html',
    '/facility.html',
    '/dashboard.html',
    '/assets/style.css',
    '/assets/script.js',
    '/assets/api.js',
    '/assets/facility.js',
    '/assets/member.js',
    '/assets/pwa.js',
    '/icon-512.png',
    '/manifest.json',
    '/manifest-admin.json',
    '/manifest-member.json'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    console.log('Goldmorr Service Worker: Installed');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching assets');
                return cache.addAll(ASSETS);
            })
    );
    self.skipWaiting();
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
    console.log('Goldmorr Service Worker: Activated');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if(key !== CACHE_NAME) {
                    console.log('Clearing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch Event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});

// Push Notification Event
self.addEventListener('push', (event) => {
    let data = { title: 'Goldmorr Update', body: 'New information available.' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Goldmorr Update', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        data: { url: data.link || '/' } // Store the link for click handling
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

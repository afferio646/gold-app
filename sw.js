// Service Worker for Goldmorr PWA
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqumaIsqElLFIE7qgRSO-jptkGa7-4LWw",
  authDomain: "goldmorr-hub.firebaseapp.com",
  projectId: "goldmorr-hub",
  storageBucket: "goldmorr-hub.firebasestorage.app",
  messagingSenderId: "900594097755",
  appId: "1:900594097755:web:750378fabd2e97135ba97e"
});

const messaging = firebase.messaging();

// Manual FCM Push Notification Handling
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    let title = 'Goldmorr Hub';
    let options = {
        body: 'New update available!',
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        data: {
            url: '/'
        }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.notification.title || title;
            options.body = data.notification.body || options.body;
            options.data.url = data.data.url || '/';
        } catch (e) {
            console.log('Push data is not JSON:', event.data.text());
            options.body = event.data.text();
        }
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();

    // This looks to see if the current window is already open and focuses it
    // if not, it opens a new window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

const CACHE_NAME = 'goldmorr-v13-member-suite';
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

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

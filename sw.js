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

// The Firebase Messaging SDK automatically handles receiving 'push' events
// and displaying notifications when the app is in the background.
// We only need a notificationclick listener to handle user interaction.

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();

    // This looks to see if the current window is already open and focuses it
    // if not, it opens a new window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Firebase data payload urls are sometimes nested under event.notification.data.FCM_MSG.data.link
            let targetUrl = '/';
            if (event.notification.data && event.notification.data.url) {
                targetUrl = event.notification.data.url;
            } else if (event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data && event.notification.data.FCM_MSG.data.link) {
                 targetUrl = event.notification.data.FCM_MSG.data.link;
            }

            const urlToOpen = new URL(targetUrl, self.location.origin).href;
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

const CACHE_NAME = 'goldmorr-v16-force-network-html';
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

// Fetch Event: Stale-While-Revalidate for HTML, Cache-First for Assets
self.addEventListener('fetch', (event) => {
    // For HTML files, always try the network first so the UI updates!
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // For everything else, serve from cache, fallback to network
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});

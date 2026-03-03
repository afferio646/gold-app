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

messaging.onBackgroundMessage(function(payload) {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-512.png',
    data: { url: payload.data ? payload.data.url : '/' }
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

const CACHE_NAME = 'goldmorr-v10-member-suite';
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

// Service Worker for Goldmorr PWA
// Currently minimal to enable "Add to Home Screen" functionality.

self.addEventListener('install', (event) => {
    console.log('Goldmorr Service Worker: Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Goldmorr Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through for now.
    // In the future, we can add offline caching logic here.
});

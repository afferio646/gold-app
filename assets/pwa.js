
// --- PWA & Push Notification Management ---

// 1. Service Worker Registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker Registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('Service Worker Registration Failed:', error);
            return null;
        }
    }
    return null;
}

// 2. Request Notification Permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification Permission:', permission);

    if (permission === 'granted') {
        // Here you would subscribe the user to your backend
        // e.g., subscribeUserToPush();
        alert("Success! You will now receive field updates.");
    } else {
        alert("Notifications blocked. Please enable them in your browser settings to receive updates.");
    }
    return permission;
}

// 3. UI Helper: Show/Hide Install & Push Buttons
function initPWAFeatures() {
    // Check if installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Add UI element for Push if not already granted
    if (Notification.permission !== 'granted' && isStandalone) {
        const header = document.querySelector('header');
        if(header) {
            const btn = document.createElement('button');
            btn.innerText = 'Enable Updates';
            btn.className = 'text-[9px] border border-red-500 text-red-400 px-3 py-1 rounded ml-2 uppercase font-bold animate-pulse';
            btn.onclick = requestNotificationPermission;
            header.querySelector('.flex.gap-4').prepend(btn);
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    // Delay slightly to let UI settle
    setTimeout(initPWAFeatures, 1000);
});

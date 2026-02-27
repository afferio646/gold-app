
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
let deferredPrompt; // To capture the install prompt

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    console.log("Install prompt captured");

    // Show Install Button if not already installed
    showInstallButton();
});

function showInstallButton() {
    const header = document.querySelector('header .flex.gap-4');
    if (!header) return;

    // Remove existing if any
    const existing = document.getElementById('pwa-install-btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.innerText = 'Save App';
    btn.className = 'text-[9px] bg-[var(--g-cyan)] text-navy-900 border border-[var(--g-cyan)] px-3 py-1.5 rounded ml-2 uppercase font-black tracking-wider shadow-lg animate-pulse';

    btn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            btn.remove(); // Hide after install
        } else {
            alert("To save: Tap your browser menu (⋮) and select 'Install App' or 'Add to Home Screen'.");
        }
    });

    header.prepend(btn);
}

function initPWAFeatures() {
    // Check if installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // If installed, show Push Button if needed
    if (isStandalone && Notification.permission !== 'granted') {
        const header = document.querySelector('header .flex.gap-4');
        if(header) {
            const btn = document.createElement('button');
            btn.innerText = 'Enable Updates';
            btn.className = 'text-[9px] border border-red-500 text-red-400 px-3 py-1 rounded ml-2 uppercase font-bold animate-pulse';
            btn.onclick = requestNotificationPermission;
            header.prepend(btn);
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    // Delay slightly to let UI settle
    setTimeout(initPWAFeatures, 1000);
});


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

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide the button immediately
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
    deferredPrompt = null;
});

// Helper to trigger install flow (called by button OR after registration)
async function triggerInstallFlow() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const btn = document.getElementById('pwa-install-btn');

    if (isIOS) {
        // iOS Custom Instruction
        alert("To save this app on iPhone:\n\n1. Tap the Share button (square with arrow) at the bottom of your screen.\n2. Scroll down and tap 'Add to Home Screen'.");
    } else if (deferredPrompt) {
        // Android Native Prompt
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        if(btn) btn.remove(); // Hide after install
    } else {
        // Fallback
        alert("To save: Tap your browser menu (⋮) and select 'Add to Home Screen'.");
    }
}

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
        // 1. Gate: Check Registration First
        const user = API.getSettings();
        if (!user || !user.name) {
            // Open Registration Modal if missing
            toggleModal('settings-modal', true);
            alert("Please certify your device before saving the app.");
            return;
        }

        // 2. Trigger Install Flow
        triggerInstallFlow();
    });

    header.prepend(btn);
}

function initPWAFeatures() {
    // Check if installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Force Show Button on iOS if not standalone (since beforeinstallprompt doesn't fire)
    if (isIOS && !isStandalone) {
        showInstallButton();
    }

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


// assets/api.js
// Firebase Integration for Goldmorr Hub

// We rely on the Firebase SDKs being loaded in the HTML via CDN
// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBqumaIsQEllFIE7qgRSO-jptkGa7-4LWw",
    authDomain: "goldmorr-hub.firebaseapp.com",
    projectId: "goldmorr-hub",
    storageBucket: "goldmorr-hub.firebasestorage.app",
    messagingSenderId: "900594097755",
    appId: "1:900594097755:web:750378fabd2e97135ba97e"
};

let db; // Firestore instance

// Initialize Firebase if global 'firebase' object exists (from CDN)
function initFirebase() {
    if (typeof firebase !== 'undefined' && !db) {
        try {
            const app = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log("Firebase Initialized Successfully");
        } catch (e) {
            console.error("Firebase Init Error:", e);
        }
    }
}

// Ensure initialization happens
document.addEventListener('DOMContentLoaded', initFirebase);

const API = {
    // --- USER SETTINGS (Local Only for Device ID) ---
    saveSettings: (settings) => {
        localStorage.setItem('goldmorr_settings', JSON.stringify(settings));
        console.log("Settings Saved Locally:", settings);

        // Also log this registration to Firebase as an "Activation"
        if(db) {
            db.collection('activations').add({
                ...settings,
                timestamp: new Date().toISOString(),
                source: new URLSearchParams(window.location.search).get('source') || 'Direct'
            });
        }
    },

    getSettings: () => {
        const s = localStorage.getItem('goldmorr_settings');
        return s ? JSON.parse(s) : null;
    },

    // --- HEARTBEAT (Usage Tracking) ---
    logAppOpen: () => {
        const user = API.getSettings();
        if(user && db) {
            const source = new URLSearchParams(window.location.search).get('source') || 'Direct';
            db.collection('usage_logs').add({
                userName: user.name,
                userEmail: user.email,
                company: user.company,
                source: source,
                timestamp: new Date().toISOString(),
                type: 'APP_OPEN'
            }).then(() => console.log("Heartbeat sent to Firebase"))
              .catch(e => console.error("Heartbeat failed", e));
        }
    },

    // --- REPORTS / LEADS ---
    saveReport: (reportData) => {
        // 1. Get Source ID from URL or Saved Settings
        const urlParams = new URLSearchParams(window.location.search);
        let sourceId = urlParams.get('source');

        // If not in URL, try to find it in previous settings or default
        if(!sourceId) sourceId = reportData.source || 'General';

        // 2. Prepare Data for Firestore
        const leadDoc = {
            ...reportData,
            source: sourceId,
            serverTimestamp: new Date().toISOString(), // Use ISO for sorting
            leadId: `${sourceId}-${Date.now().toString().slice(-6)}` // Generate ID
        };

        // 3. Send to Firebase
        if (db) {
            db.collection('leads').add(leadDoc)
                .then((docRef) => {
                    console.log("Report saved with ID: ", docRef.id);
                })
                .catch((error) => {
                    console.error("Error adding document: ", error);
                    alert("Offline Mode: Data saved locally (Sync pending)");
                });
        } else {
            console.warn("Firebase not ready. Saving locally.");
        }

        // 4. Fallback: Save to LocalStorage (for offline history)
        let leads = JSON.parse(localStorage.getItem('goldmorr_leads') || '[]');
        leads.unshift(leadDoc);
        localStorage.setItem('goldmorr_leads', JSON.stringify(leads));

        return leadDoc;
    },

    // --- DASHBOARD: GET LEADS ---
    getLeads: async () => {
        if (!db) {
            console.warn("Using Local Data (Firebase unavailable)");
            return JSON.parse(localStorage.getItem('goldmorr_leads') || '[]');
        }

        try {
            const snapshot = await db.collection('leads').orderBy('serverTimestamp', 'desc').limit(50).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error("Error fetching leads:", e);
            return [];
        }
    }
};

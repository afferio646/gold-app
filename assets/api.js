
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
    saveReport: async (reportData) => {
        // 1. Get Source ID
        const urlParams = new URLSearchParams(window.location.search);
        let sourceId = urlParams.get('source');
        if(!sourceId) sourceId = reportData.source || 'General';

        let leadId = `${sourceId}-PENDING`;

        // 2. Sequential ID Logic (Transaction)
        if (db) {
            const counterRef = db.collection('counters').doc('leads');

            try {
                await db.runTransaction(async (transaction) => {
                    const counterDoc = await transaction.get(counterRef);
                    let newCount = 1001; // Start at 1001

                    if (counterDoc.exists) {
                        newCount = counterDoc.data().count + 1;
                    }

                    transaction.set(counterRef, { count: newCount });
                    leadId = `GM-${newCount}`; // Global Sequential ID
                });
            } catch (e) {
                console.error("Transaction failed: ", e);
                leadId = `${sourceId}-${Date.now().toString().slice(-4)}`; // Fallback
            }
        }

        // 3. Prepare Final Doc
        const leadDoc = {
            ...reportData,
            source: sourceId,
            serverTimestamp: new Date().toISOString(),
            leadId: leadId
        };

        // 4. Save to Leads Collection
        if (db) {
            db.collection('leads').add(leadDoc)
                .then(() => console.log("Lead Saved:", leadId))
                .catch(e => console.error("Save Error:", e));
        }

        // 5. Local Backup
        let leads = JSON.parse(localStorage.getItem('goldmorr_leads') || '[]');
        leads.unshift(leadDoc);
        localStorage.setItem('goldmorr_leads', JSON.stringify(leads));

        return leadDoc;
    },

    // --- DASHBOARD: GET METRICS ---
    getDashboardData: async () => {
        if (!db) return { leads: [], stats: null };

        try {
            // 1. Get Recent Leads
            const leadSnap = await db.collection('leads').orderBy('serverTimestamp', 'desc').limit(50).get();
            const leads = leadSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Get Distribution Count (Activations)
            // Note: In a real high-volume app, we would use a distributed counter.
            // For <1000 users, getting the size is acceptable or we read a stats doc.
            const actSnap = await db.collection('activations').get();
            const distributedCount = actSnap.size;

            // 3. Get Scans Used (Total Reports)
            // Ideally we use the 'counters/leads' doc we created
            const counterDoc = await db.collection('counters').doc('leads').get();
            const scansUsed = counterDoc.exists ? (counterDoc.data().count - 1000) : 0;

            // 4. Active Users (Unique emails in usage_logs last 30 days - Simplified to total registrations for now)
            const activeUsers = distributedCount;

            return {
                leads: leads,
                stats: {
                    distributed: distributedCount,
                    scans: scansUsed,
                    active: activeUsers
                }
            };
        } catch (e) {
            console.error("Dashboard Fetch Error:", e);
            return { leads: [], stats: null };
        }
    },

    getLeads: async () => {
        // Legacy support wrapper
        const data = await API.getDashboardData();
        return data.leads;
    }
};

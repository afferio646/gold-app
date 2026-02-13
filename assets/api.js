
// assets/api.js
// This file handles data persistence.
// Currently acts as a Mock API using LocalStorage.
// It is structured to be easily replaced with Firebase calls later.

const API = {
    // --- USER SETTINGS ---
    saveSettings: (settings) => {
        localStorage.setItem('goldmorr_settings', JSON.stringify(settings));
        console.log("Settings Saved:", settings);
    },

    getSettings: () => {
        const s = localStorage.getItem('goldmorr_settings');
        return s ? JSON.parse(s) : null;
    },

    // --- REPORTS / LEADS ---
    saveReport: (reportData) => {
        // In Firebase, this would be addDoc(collection(db, "leads"), reportData)

        // 1. Get Source ID from URL (e.g. ?source=REP1)
        const urlParams = new URLSearchParams(window.location.search);
        const sourceId = urlParams.get('source') || 'WEB';

        // 2. Generate a Mock "Sequential" ID
        // (In Firebase, we'd use a transaction to increment a counter)
        const timestampSuffix = Date.now().toString().slice(-4);
        const mockLeadId = `${sourceId}-${timestampSuffix}`;

        // 3. Get existing leads from local storage (to simulate a DB)
        let leads = JSON.parse(localStorage.getItem('goldmorr_leads') || '[]');

        // 4. Add metadata
        const newLead = {
            id: mockLeadId,
            source: sourceId,
            timestamp: new Date().toLocaleString(),
            ...reportData
        };

        // 5. Save back
        leads.unshift(newLead); // Add to top
        localStorage.setItem('goldmorr_leads', JSON.stringify(leads));

        console.log("Report Uploaded to Mock DB:", newLead);
        return newLead;
    },

    getLeads: () => {
        // In Firebase, this would be getDocs(collection(db, "leads"))
        return JSON.parse(localStorage.getItem('goldmorr_leads') || '[]');
    },

    // --- AUTH (MOCK) ---
    login: (username, password) => {
        // Simple mock check
        if(username === 'ADMIN' && password === 'password') {
            return { id: 'admin-001', name: 'Goldmorr Admin' };
        }
        return null;
    }
};


document.addEventListener('DOMContentLoaded', () => {
    // Check user registration
    if (typeof API !== 'undefined') {
        const user = API.getSettings();
        if(!user) {
            toggleModal('settings-modal', true);
        }
    }

    // Attach event listeners to all inputs to auto-calculate (optional)
    // or just rely on the "Generate Report" button.
});

// --- SCORING CONSTANTS & LOGIC ---

function getStructuralScore(inputs) {
    let score = 0;
    const details = []; // For report table

    // 1. Surface / structural RH (%)
    let p1 = 0;
    const rh = inputs.rh;
    if (rh <= 75) p1 = 0;
    else if (rh <= 80) p1 = 10;
    else if (rh <= 85) p1 = 20;
    else if (rh <= 90) p1 = 28;
    else p1 = 35;
    score += p1;
    details.push({ factor: "Surface / structural RH (%)", input: rh + "%", points: p1 });

    // 2. Surface RH time pattern
    let p2 = parseInt(inputs.rhPattern) || 0;
    score += p2;
    details.push({ factor: "Surface RH time pattern", input: getText('f-rh-pattern'), points: p2 });

    // 3. Temperature (F)
    let p3 = 0;
    const t = inputs.temp;
    if (t >= 41 && t <= 104) p3 = 10;
    else if ((t >= 32 && t < 41) || (t > 104 && t <= 113)) p3 = 5;
    else p3 = 0;
    score += p3;
    details.push({ factor: "Temperature in growth range (°F)", input: t, points: p3 });

    // 4. Wood moisture content MC% (optional)
    let p4 = 0;
    const mc = inputs.woodMc;
    if (!mc && mc !== 0) p4 = 0; // blank
    else if (mc < 16) p4 = 0;
    else if (mc <= 19) p4 = 6;
    else if (mc <= 22) p4 = 12;
    else p4 = 15;
    score += p4;
    details.push({ factor: "Wood moisture content MC% (optional)", input: mc ? mc + "%" : "N/A", points: p4 });

    // 5. Material type sensitivity
    let p5 = parseInt(inputs.material) || 0;
    score += p5;
    details.push({ factor: "Material type sensitivity", input: getText('f-material'), points: p5 });

    // 6. Time since wetting / intrusion
    // Value is 0, 2, 4, 7, 9, 10, 6 (unknown)
    let p6 = parseInt(inputs.timeWet) || 0;
    score += p6;
    details.push({ factor: "Time since wetting / intrusion", input: getText('f-time-wet'), points: p6 });

    // 7. Condensation / wetness
    let p7 = parseInt(inputs.condense) || 0;
    score += p7;
    details.push({ factor: "Condensation / wetness", input: getText('f-condense'), points: p7 });

    // 8. Visible mold present
    let p8 = parseInt(inputs.moldVis) || 0;
    score += p8;
    details.push({ factor: "Visible mold present", input: getText('f-mold-vis'), points: p8 });

    // 9. Recent water event (30 days)
    let p9 = parseInt(inputs.waterEvent) || 0;
    score += p9;
    details.push({ factor: "Recent water event (30 days)", input: getText('f-water-event'), points: p9 });

    // Cap at 100? Assuming yes.
    if (score > 100) score = 100;

    return { score, details };
}

function getAirQualityScore(inputs, structuralScore) {
    let score = 0;
    const details = [];

    // 1. Visible mold extent
    // Note: Use same input as structural but points differ?
    // Structural: None=0, Localized=6, Widespread=10
    // AQ: None=0, Localized=20, Widespread=35
    // The dropdown values for 'f-mold-vis' will be stored as strings (e.g. "0", "6", "10") for Structural.
    // I need to map them or have separate logic.
    // BETTER: The dropdown values should be keys (e.g., "none", "local", "wide") and I map them to points here.

    let p1 = 0;
    const moldVal = inputs.moldVisKey; // "none", "local", "wide"
    if (moldVal === 'local') p1 = 20;
    else if (moldVal === 'wide') p1 = 35;
    else p1 = 0;
    score += p1;
    details.push({ factor: "Visible mold extent", input: getText('f-mold-vis'), points: p1 });

    // 2. Musty odor
    let p2 = parseInt(inputs.odor) || 0;
    score += p2;
    details.push({ factor: "Musty odor", input: getText('f-odor'), points: p2 });

    // 3. HVAC distribution potential
    let p3 = parseInt(inputs.hvac) || 0;
    score += p3;
    details.push({ factor: "HVAC distribution potential", input: getText('f-hvac'), points: p3 });

    // 4. Disturbance / aerosolization
    let p4 = parseInt(inputs.disturb) || 0;
    score += p4;
    details.push({ factor: "Disturbance / aerosolization", input: getText('f-disturb'), points: p4 });

    // 5. Indoor RH persistence pattern
    let p5 = parseInt(inputs.rhPersist) || 0;
    score += p5;
    details.push({ factor: "Indoor RH persistence pattern", input: getText('f-rh-persist'), points: p5 });

    // 6. Time since wetting / intrusion
    // Re-use input but map to AQ points
    // Structural Pts: 0, 2, 4, 7, 9, 10, 6(unk)
    // AQ Pts:         0, 1, 2, 3, 4, 5,  3(unk)
    // I need the Key again.
    let p6 = 0;
    const timeKey = inputs.timeWetKey;
    switch(timeKey) {
        case 'none': p6 = 0; break;
        case '24h': p6 = 1; break;
        case '1-2d': p6 = 2; break;
        case '3-7d': p6 = 3; break;
        case '8-30d': p6 = 4; break;
        case '>30d': p6 = 5; break;
        case 'unk': p6 = 3; break;
        default: p6 = 0;
    }
    score += p6;
    details.push({ factor: "Time since wetting / intrusion", input: getText('f-time-wet'), points: p6 });

    // 7. Surface conditions supportive
    // From structural score
    let p7 = 0;
    if (structuralScore < 20) p7 = 0;
    else if (structuralScore <= 39) p7 = 3;
    else if (structuralScore <= 59) p7 = 6;
    else p7 = 10; // >= 60
    score += p7;
    details.push({ factor: "Surface conditions supportive", input: structuralScore, points: p7 });

    if (score > 100) score = 100;
    return { score, details };
}

function getStructuralBand(score) {
    if (score < 20) return { name: "Low", color: "text-green-500" };
    if (score < 40) return { name: "Guarded", color: "text-blue-500" };
    if (score < 60) return { name: "Elevated", color: "text-yellow-500" };
    if (score < 80) return { name: "High", color: "text-orange-500" };
    return { name: "Severe", color: "text-red-600" };
}

function getAQBand(score) {
    if (score < 20) return { name: "Normal", color: "text-green-500" };
    if (score < 40) return { name: "Mild", color: "text-blue-500" };
    if (score < 60) return { name: "Moderate", color: "text-yellow-500" };
    if (score < 80) return { name: "High", color: "text-orange-500" };
    return { name: "Very High", color: "text-red-600" };
}

// Helper to get selected text for report
function getText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === 'SELECT') {
        return el.options[el.selectedIndex].text;
    }
    return el.value;
}

// --- MAIN FUNCTION ---

function runAuditProcess() {
    // Gather Inputs
    const inputs = {
        rh: parseFloat(document.getElementById('f-rh').value) || 0,
        rhPattern: document.getElementById('f-rh-pattern').value,
        temp: parseFloat(document.getElementById('f-temp').value) || 0,
        woodMc: document.getElementById('f-wood-mc').value ? parseFloat(document.getElementById('f-wood-mc').value) : null,
        material: document.getElementById('f-material').value,
        timeWet: document.getElementById('f-time-wet').value, // Structural points
        timeWetKey: document.getElementById('f-time-wet').selectedOptions[0].getAttribute('data-key'),
        condense: document.getElementById('f-condense').value,
        moldVis: document.getElementById('f-mold-vis').value, // Structural points
        moldVisKey: document.getElementById('f-mold-vis').selectedOptions[0].getAttribute('data-key'),
        waterEvent: document.getElementById('f-water-event').value,
        odor: document.getElementById('f-odor').value,
        hvac: document.getElementById('f-hvac').value,
        disturb: document.getElementById('f-disturb').value,
        rhPersist: document.getElementById('f-rh-persist').value
    };

    // Calculate
    const struct = getStructuralScore(inputs);
    const aq = getAirQualityScore(inputs, struct.score);

    const structBand = getStructuralBand(struct.score);
    const aqBand = getAQBand(aq.score);

    // Update Results UI (Main View)
    const statusEl = document.getElementById('f-status');
    statusEl.innerText = structBand.name.toUpperCase();
    statusEl.className = `text-xl font-black uppercase ${structBand.color}`;

    document.getElementById('f-analysis-text').innerHTML = `
        <p>• <strong>Structural Risk:</strong> Score ${struct.score} (${structBand.name}).</p>
        <p>• <strong>Air Quality Impact:</strong> Score ${aq.score} (${aqBand.name}).</p>
        <p>• <strong>Summary:</strong> Conditions indicate a <strong>${structBand.name}</strong> risk of fungal growth with a <strong>${aqBand.name}</strong> impact on air quality.</p>
    `;

    document.getElementById('f-res').classList.remove('hidden');

    // Populate Report Data (Hidden until modal open)
    window.currentReportData = { struct, aq, structBand, aqBand, inputs };
}

function openReportModal() {
    const data = window.currentReportData;
    if (!data) {
        runAuditProcess();
        // If still no data (validation failed?), return
        if (!window.currentReportData) return;
    }

    const { struct, aq, structBand, aqBand, inputs } = window.currentReportData;
    const pName = document.getElementById('p-name').value || "N/A";

    // Generate Tables
    const structRows = struct.details.map(d => `
        <tr class="border-b border-gray-200 text-xs">
            <td class="py-2 font-medium text-gray-700">${d.factor}</td>
            <td class="py-2 text-gray-600">${d.input}</td>
            <td class="py-2 text-right font-bold text-gray-900">${d.points}</td>
        </tr>
    `).join('');

    const aqRows = aq.details.map(d => `
        <tr class="border-b border-gray-200 text-xs">
            <td class="py-2 font-medium text-gray-700">${d.factor}</td>
            <td class="py-2 text-gray-600">${d.input}</td>
            <td class="py-2 text-right font-bold text-gray-900">${d.points}</td>
        </tr>
    `).join('');

    document.getElementById('modal-content').innerHTML = `
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-gray-50 p-4 rounded border border-gray-200">
                <h4 class="font-bold text-sm uppercase text-gray-500 mb-2">Structural Risk</h4>
                <div class="flex justify-between items-end">
                    <span class="text-3xl font-black ${structBand.color}">${struct.score}</span>
                    <span class="text-sm font-bold uppercase ${structBand.color}">${structBand.name}</span>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded border border-gray-200">
                <h4 class="font-bold text-sm uppercase text-gray-500 mb-2">Air Quality Impact</h4>
                <div class="flex justify-between items-end">
                    <span class="text-3xl font-black ${aqBand.color}">${aq.score}</span>
                    <span class="text-sm font-bold uppercase ${aqBand.color}">${aqBand.name}</span>
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2">Structural (Fungal Growth) Risk Factors</h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] uppercase text-gray-400 border-b border-gray-300">
                        <th class="pb-2">Factor</th>
                        <th class="pb-2">Input</th>
                        <th class="pb-2 text-right">Points</th>
                    </tr>
                </thead>
                <tbody>${structRows}</tbody>
            </table>
        </div>

        <div>
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2">Air Quality Impact Factors</h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] uppercase text-gray-400 border-b border-gray-300">
                        <th class="pb-2">Factor</th>
                        <th class="pb-2">Input</th>
                        <th class="pb-2 text-right">Points</th>
                    </tr>
                </thead>
                <tbody>${aqRows}</tbody>
            </table>
        </div>
    `;

    document.getElementById('report-modal').classList.remove('hidden');
}

function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    alert("Report generated! (Simulation: PDF sent to email)");
    document.getElementById('report-modal').classList.add('hidden');
}

function saveUserSettings() {
    const name = document.getElementById('set-name').value;
    const company = document.getElementById('set-company').value;
    const email = document.getElementById('set-email').value;

    if(!name || !company || !email) {
        alert("All fields are required.");
        return;
    }

    API.saveSettings({ name, company, email });
    toggleModal('settings-modal', false);
}

function openSettings() {
        const user = API.getSettings();
        if(user) {
            document.getElementById('set-name').value = user.name;
            document.getElementById('set-company').value = user.company;
            document.getElementById('set-email').value = user.email;
        }
        toggleModal('settings-modal', true);
}

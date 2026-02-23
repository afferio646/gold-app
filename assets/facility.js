
document.addEventListener('DOMContentLoaded', () => {
    if (typeof API !== 'undefined') {
        const user = API.getSettings();
        if(!user) {
            toggleModal('settings-modal', true);
        }
    }
});

// --- SCORING LOGIC ---

function getStructuralScore(inputs) {
    let score = 0;
    const details = [];

    // 1. Visible Mold Growth (0-50 pts)
    let p1 = 0;
    const mold = parseInt(inputs.mold); // 0=None, 1=Light, 2=Moderate, 3=Heavy
    if(mold === 1) p1 = 15;
    else if(mold === 2) p1 = 30;
    else if(mold === 3) p1 = 50;
    score += p1;
    details.push({ factor: "Visible Mold Growth", input: getText('f-mold-growth'), points: p1 });

    // 2. Surface Type (0-10 pts)
    let p2 = 0;
    const surface = parseInt(inputs.surface); // 2=Drywall(High), 1=Wood/Mixed, 0=Masonry
    if(surface === 2) p2 = 10;
    else if(surface === 1) p2 = 5;
    else p2 = 2;
    score += p2;
    details.push({ factor: "Surface Type", input: getText('f-surface-type'), points: p2 });

    // 3. Moisture History (0-30 pts)
    let p3 = 0;
    const moisture = parseInt(inputs.moisture); // 2=Recent, 1=Past/Unknown, 3=Ongoing
    if(moisture === 3) p3 = 30; // Ongoing
    else if(moisture === 2) p3 = 20; // Recent
    else if(moisture === 1) p3 = 10; // Past/Unknown
    score += p3;
    details.push({ factor: "Moisture History", input: getText('f-moisture-hist'), points: p3 });

    // 4. RH Factor (Optional) (0-20 pts)
    let p4 = 0;
    if(inputs.rh) {
        if(inputs.rh > 80) p4 = 20;
        else if(inputs.rh > 60) p4 = 10;
    }
    score += p4;
    details.push({ factor: "Current RH > 60%", input: inputs.rh ? inputs.rh + '%' : "N/A", points: p4 });

    // Cap at 100
    if (score > 100) score = 100;
    return { score, details };
}

function getAirQualityScore(inputs, structuralScore) {
    let score = 0;
    const details = [];

    // 1. Visible Mold Impact (0-50 pts) - Same as structural base
    let p1 = 0;
    const mold = parseInt(inputs.mold);
    if(mold === 1) p1 = 10;
    else if(mold === 2) p1 = 30;
    else if(mold === 3) p1 = 50;
    score += p1;
    details.push({ factor: "Visible Mold Impact", input: getText('f-mold-growth'), points: p1 });

    // 2. Sensory Indicators (0-25 pts)
    let p2 = 0;
    const sensory = parseInt(inputs.sensory); // 2=Musty, 1=Condense/HighHum, 0=None
    if(sensory === 2) p2 = 25;
    else if(sensory === 1) p2 = 15;
    score += p2;
    details.push({ factor: "Sensory Indicators", input: getText('f-sensory'), points: p2 });

    // 3. HVAC Risk (0-25 pts)
    let p3 = 0;
    const hvac = parseInt(inputs.hvac); // 2=Yes, 1=Unsure, 0=No
    if(hvac === 2) p3 = 25;
    else if(hvac === 1) p3 = 10;
    score += p3;
    details.push({ factor: "HVAC Distribution Risk", input: getText('f-hvac-risk'), points: p3 });

    // Cap at 100
    if (score > 100) score = 100;
    return { score, details };
}

function getStructuralBand(score) {
    if (score <= 15) return { name: "Minimal", color: "text-green-500" };
    if (score <= 30) return { name: "Guarded", color: "text-yellow-500" }; // Yellowish
    if (score <= 50) return { name: "Elevated", color: "text-orange-500" };
    if (score <= 75) return { name: "High", color: "text-red-500" };
    return { name: "Severe", color: "text-red-700" };
}

function getAQBand(score) {
    if (score <= 20) return { name: "Clean", color: "text-green-500" };
    if (score <= 40) return { name: "Mild Impact", color: "text-blue-500" };
    if (score <= 60) return { name: "Moderate Impact", color: "text-yellow-500" };
    if (score <= 80) return { name: "High Impact", color: "text-orange-500" };
    return { name: "Severe", color: "text-red-700" };
}

function getText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === 'SELECT') {
        return el.options[el.selectedIndex].text;
    }
    return el.value;
}

// --- MAIN PROCESS ---

function runAuditProcess() {
    // 1. Gather Inputs
    const inputs = {
        mold: document.getElementById('f-mold-growth').value,
        surface: document.getElementById('f-surface-type').value,
        moisture: document.getElementById('f-moisture-hist').value,
        sensory: document.getElementById('f-sensory').value,
        hvac: document.getElementById('f-hvac-risk').value,
        rh: document.getElementById('f-rh').value ? parseFloat(document.getElementById('f-rh').value) : null,
        temp: document.getElementById('f-temp').value ? parseFloat(document.getElementById('f-temp').value) : null
    };

    // 2. Calculate Scores
    const struct = getStructuralScore(inputs);
    const aq = getAirQualityScore(inputs, struct.score);

    const structBand = getStructuralBand(struct.score);
    const aqBand = getAQBand(aq.score);

    // 3. Update Result Card
    document.getElementById('score-struct').innerText = struct.score;
    document.getElementById('band-struct').innerText = structBand.name;
    document.getElementById('band-struct').className = `text-[10px] font-bold uppercase mt-1 ${structBand.color}`;

    document.getElementById('score-aq').innerText = aq.score;
    document.getElementById('band-aq').innerText = aqBand.name;
    document.getElementById('band-aq').className = `text-[10px] font-bold uppercase mt-1 ${aqBand.color}`;

    // Show Results
    document.getElementById('f-res').classList.remove('hidden');

    // Store data for report
    window.currentReportData = { struct, aq, structBand, aqBand, inputs };
}

function openReportModal() {
    const data = window.currentReportData;
    if (!data) { runAuditProcess(); if (!window.currentReportData) return; }

    const { struct, aq, structBand, aqBand, inputs } = window.currentReportData;
    const pName = document.getElementById('p-name').value || "N/A";
    const photoCount = document.getElementById('f-photos').files.length;

    // Conditional Missing Info Text
    let missingInfoText = "";
    if (inputs.rh === null || inputs.temp === null) {
        missingInfoText = `<p class="text-xs text-gray-500 italic mt-4 border-t border-gray-100 pt-2">
            The relative humidity and current temperature information were not available, and therefore that information is not included in the report.
        </p>`;
    }

    document.getElementById('modal-content').innerHTML = `
        <!-- Project Context -->
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-6 border border-gray-200 rounded mb-8">
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Project / Facility</p><p class="font-bold text-lg">${pName}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Date</p><p class="font-bold">${new Date().toLocaleDateString()}</p></div>
        </div>

        <!-- Scores Summary -->
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-blue-50 p-4 rounded border border-blue-100 text-center">
                <h4 class="font-bold text-sm uppercase text-blue-800 mb-2">Structural Risk</h4>
                <div class="text-4xl font-black ${structBand.color}">${struct.score}</div>
                <div class="text-sm font-bold uppercase ${structBand.color}">${structBand.name}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded border border-blue-100 text-center">
                <h4 class="font-bold text-sm uppercase text-blue-800 mb-2">Air Quality Impact</h4>
                <div class="text-4xl font-black ${aqBand.color}">${aq.score}</div>
                <div class="text-sm font-bold uppercase ${aqBand.color}">${aqBand.name}</div>
            </div>
        </div>

        <!-- Detailed Factors -->
        <div class="mb-6">
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2 text-gray-700">Assessment Factors</h3>
            <ul class="text-sm space-y-2">
                ${struct.details.map(d => `<li class="flex justify-between border-b border-gray-100 pb-1"><span>${d.factor}:</span> <span class="font-bold">${d.input}</span></li>`).join('')}
                ${aq.details.filter(d => !struct.details.find(sd => sd.factor === d.factor)).map(d => `<li class="flex justify-between border-b border-gray-100 pb-1"><span>${d.factor}:</span> <span class="font-bold">${d.input}</span></li>`).join('')}
            </ul>
            ${missingInfoText}
        </div>

        <p class="text-[11px] text-gray-500 italic">Attached Evidence: ${photoCount} Photo(s) (See Appendix)</p>
    `;

    document.getElementById('report-modal').classList.remove('hidden');
}

function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    // Minimal Data for Dashboard
    const pName = document.getElementById('p-name').value || "N/A";
    const scoreText = `${document.getElementById('score-struct').innerText} / ${document.getElementById('score-aq').innerText}`;

    const reportData = {
        user: user,
        project: {
            name: pName,
            type: "Facility Audit"
        },
        appType: 'Facility Guard',
        score: scoreText,
        timestamp: new Date().toLocaleString(),
        details: window.currentReportData
    };

    // Save
    API.saveReport(reportData);

    alert(`Report for "${pName}" exported successfully! \n(Saved to Dashboard)`);
    document.getElementById('report-modal').classList.add('hidden');
}

function saveUserSettings() {
    const name = document.getElementById('set-name').value;
    const company = document.getElementById('set-company').value;
    const email = document.getElementById('set-email').value;
    if(!name || !company || !email) { alert("All fields required."); return; }
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

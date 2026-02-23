
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
    if (score <= 15) return { name: "Minimal Risk", color: "text-green-500", barColor: "#22c55e" };
    if (score <= 30) return { name: "Guarded Risk", color: "text-yellow-400", barColor: "#facc15" };
    if (score <= 50) return { name: "Elevated Risk", color: "text-orange-400", barColor: "#fb923c" };
    if (score <= 75) return { name: "High Risk", color: "text-red-500", barColor: "#ef4444" };
    return { name: "Severe Risk", color: "text-red-600", barColor: "#dc2626" };
}

function getAQBand(score) {
    if (score <= 20) return { name: "Normal AQ Impact", color: "text-green-500" };
    if (score <= 40) return { name: "Mild AQ Impact", color: "text-blue-400" };
    if (score <= 60) return { name: "Moderate Impact", color: "text-yellow-400" };
    if (score <= 80) return { name: "High Impact", color: "text-orange-400" };
    return { name: "Severe Impact", color: "text-red-600" };
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

    const projectInfo = {
        type: document.getElementById('f-type').value,
        source: document.getElementById('f-source').value
    };

    // 2. Calculate Scores
    const struct = getStructuralScore(inputs);
    const aq = getAirQualityScore(inputs, struct.score);

    const structBand = getStructuralBand(struct.score);
    const aqBand = getAQBand(aq.score);

    // 3. Generate Project Analysis Text (Legacy Text Logic)
    let legacyText = `<strong>Assessment Note:</strong> Based on the facility type (${projectInfo.type}) and water source (${projectInfo.source}), follow standard Goldmorr protocols for surface neutralization.`;

    if(parseInt(inputs.mold) >= 2 || parseInt(inputs.moisture) >= 2) {
        legacyText = `<strong>Warning:</strong> Active moisture source or visible growth detected. This environment requires immediate substrate isolation and GM6000 treatment.`;
    }

    const analysisPoints = [];
    if(inputs.rh && inputs.rh > 60) analysisPoints.push(`High RH (${inputs.rh}%) indicates systemic envelope failure.`);
    if(parseInt(inputs.hvac) === 2) analysisPoints.push("HVAC system compromised; duct cleaning protocol advised.");

    const bulletList = analysisPoints.length > 0 ? `<ul class="list-disc pl-5 space-y-2 mt-4 text-gray-400 text-[11px] font-light leading-relaxed">
        ${analysisPoints.map(p => `<li>${p}</li>`).join('')}
    </ul>` : `<ul class="list-disc pl-5 space-y-2 mt-4 text-gray-400 text-[11px] font-light leading-relaxed"><li>No critical high-risk factors identified based on current inputs.</li></ul>`;

    // 4. Update Result Card (Gauge & Text)
    // Update Text Sections
    document.getElementById('legacy-text').innerHTML = legacyText;
    document.getElementById('analysis-bullets').innerHTML = bulletList;

    // Update Gauge Visuals
    // Max rotation is 135deg (full). 0 = -135deg.
    // Score 0-100 mapped to -135 to 135? No, css is -135 start.
    // Wait, CSS says: transform: rotate(-135deg). This is 0 position.
    // 100% would be rotate(45deg). Total range = 180deg.
    // So rotation = -135 + (score/100 * 180).
    const rotation = -135 + ((struct.score / 100) * 180);
    const gauge = document.getElementById('gauge-fill');
    gauge.style.transform = `rotate(${rotation}deg)`;
    gauge.style.borderColor = structBand.barColor; // Top/Right colors set in CSS, but let's override logic if needed.
    // Actually border-top-color and right-color need setting.
    gauge.style.borderTopColor = structBand.barColor;
    gauge.style.borderRightColor = structBand.barColor;

    // Update Gauge Text
    document.getElementById('score-main').innerText = struct.score;
    document.querySelector('.gauge-label').innerText = structBand.name;
    document.querySelector('.gauge-label').className = `gauge-label ${structBand.color}`; // Apply text color

    // Update Dual Text Below
    const sText = document.getElementById('struct-text');
    sText.innerText = `${structBand.name} Structural Risk`;
    sText.className = structBand.color;

    const aqText = document.getElementById('aq-text');
    aqText.innerText = aqBand.name;
    aqText.className = aqBand.color;

    // Show Results
    document.getElementById('f-res').classList.remove('hidden');

    // Store data for report
    window.currentReportData = { struct, aq, structBand, aqBand, inputs, projectInfo, legacyText, analysisPoints };
}

function generateRecoveryStrategy(inputs, projectInfo) {
    const isPorous = document.getElementById('f-surface-type').value !== '0'; // 0 is Masonry
    const materialAction = isPorous
        ? `Microbial colonization detected on Porous Substrate. Saturate application of GM6000 penetrating modifiers required.`
        : `Surface contamination on Non-Porous Substrate. Standard GM6000 surface treatment protocols apply.`;

    // Only show RH line if RH exists
    const rhLine = inputs.rh ? `<li><strong>Environmental Factors:</strong> Relative Humidity of ${inputs.rh}% identified as moisture catalyst.</li>` : '';

    return `
        <div class="mb-8 pl-4 border-l-4 border-[var(--g-cyan)]">
            <h4 class="font-bold text-lg uppercase mb-4 italic text-gray-900">SUBJECT: CERTIFIED RECOVERY STRATEGY</h4>
            <p class="text-sm text-gray-800 leading-relaxed mb-4">
                Based on the calculated environmental load for this <strong>${projectInfo.type}</strong> environment, traditional mechanical removal is insufficient. The following Goldmorr protocols are strictly mandated to achieve IICRC air quality standards:
            </p>
            <ul class="list-disc pl-5 space-y-3 text-sm text-gray-800 leading-relaxed">
                ${rhLine}
                <li><strong>Substrate Impact:</strong> ${materialAction}</li>
                <li><strong>Air Particle Clearance:</strong> Whole-structure non-mechanical air scrubbing via proprietary GM2000 fogging protocol is mandatory for particle neutralization.</li>
            </ul>
        </div>
    `;
}

function openReportModal() {
    const data = window.currentReportData;
    if (!data) { runAuditProcess(); if (!window.currentReportData) return; }

    const { struct, aq, structBand, aqBand, projectInfo, legacyText, analysisPoints, inputs } = window.currentReportData;
    const pName = document.getElementById('p-name').value || "N/A";
    const photoCount = document.getElementById('f-photos').files.length;

    // Conditional Missing Info Text
    let missingInfoText = "";
    if (inputs.rh === null || inputs.temp === null) {
        missingInfoText = `<p class="text-xs text-gray-500 italic mt-4 border-t border-gray-100 pt-2">
            The relative humidity and current temperature information were not available, and therefore that information is not included in the report.
        </p>`;
    }

    // Bullet list for Analysis
    const analysisBullets = analysisPoints.length > 0 ? `<ul class="list-disc pl-5 mt-2 space-y-1">${analysisPoints.map(p => `<li>${p}</li>`).join('')}</ul>` : `<ul class="list-disc pl-5 mt-2"><li>No critical factors identified.</li></ul>`;

    // 1. Header (Goldmorr System) - Already in HTML

    // 2. Project Context Block (Top of Body)
    const contextBlock = `
        <div class="bg-gray-50 p-6 border border-gray-200 rounded mb-8">
            <div class="grid grid-cols-2 gap-8 mb-4 border-b border-gray-200 pb-4">
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Project / Facility</p><p class="font-bold text-lg text-gray-900">${pName}</p></div>
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Facility Type</p><p class="font-bold text-gray-900">${projectInfo.type}</p></div>
            </div>
            <div class="grid grid-cols-2 gap-8">
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Water Source</p><p class="font-bold text-gray-900">${projectInfo.source}</p></div>
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Date</p><p class="font-bold text-gray-900">${new Date().toLocaleDateString()}</p></div>
            </div>
        </div>
    `;

    // 3. Subject: Project Analysis Strategy (Top Section per Request)
    const analysisBlock = `
        <div class="mb-8 pl-4 border-l-4 border-[var(--g-cyan)]">
            <h4 class="font-bold text-lg uppercase mb-2 italic text-gray-900">SUBJECT: PROJECT ANALYSIS STRATEGY</h4>
            <div class="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><strong>Assessment Note:</strong> Based on the facility type (${projectInfo.type}) and water source (${projectInfo.source}), follow standard Goldmorr protocols for surface neutralization.</p>
                ${analysisBullets}
                <p class="text-[11px] text-gray-400 italic mt-2">Attached Evidence: ${photoCount} Photo(s) (See Appendix)</p>
            </div>
        </div>
    `;

    // 4. Certified Recovery Strategy (Second Section)
    const recoveryBlock = generateRecoveryStrategy(inputs, projectInfo);

    // 5. Score Summary (Colored Boxes)
    const scoreBlock = `
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-blue-50 p-4 rounded border border-blue-100 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-sm uppercase text-blue-800 mb-1">Structural Risk Score</h4>
                    <div class="text-4xl font-black ${structBand.color}">${struct.score}</div>
                </div>
                <div class="text-sm font-bold uppercase ${structBand.color} text-right self-end pb-1">${structBand.name}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded border border-blue-100 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-sm uppercase text-blue-800 mb-1">Air Quality Impact Score</h4>
                    <div class="text-4xl font-black ${aqBand.color}">${aq.score}</div>
                </div>
                <div class="text-sm font-bold uppercase ${aqBand.color} text-right self-end pb-1">${aqBand.name}</div>
            </div>
        </div>
    `;

    // 6. Detailed Factor Tables (Bottom)
    const tablesBlock = `
        <div class="mb-6">
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2 text-gray-700">Structural Risk Factors</h3>
            <div class="border-t border-gray-200">
                ${struct.details.map(d => `
                    <div class="flex justify-between py-2 border-b border-gray-100 text-sm">
                        <span class="text-gray-600">${d.factor}</span>
                        <div class="flex gap-4">
                            <span class="font-bold text-gray-900">${d.input}</span>
                            <span class="font-bold text-gray-400 w-8 text-right">${d.points}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div>
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2 text-gray-700">Air Quality Factors</h3>
            <div class="border-t border-gray-200">
                ${aq.details.filter(d => !struct.details.find(sd => sd.factor === d.factor)).map(d => `
                    <div class="flex justify-between py-2 border-b border-gray-100 text-sm">
                        <span class="text-gray-600">${d.factor}</span>
                        <div class="flex gap-4">
                            <span class="font-bold text-gray-900">${d.input}</span>
                            <span class="font-bold text-gray-400 w-8 text-right">${d.points}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${missingInfoText}
        </div>
    `;

    document.getElementById('modal-content').innerHTML = `
        ${contextBlock}
        ${analysisBlock}
        ${recoveryBlock}
        ${scoreBlock}
        ${tablesBlock}
    `;

    document.getElementById('report-modal').classList.remove('hidden');
}

function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    // Minimal Data for Dashboard
    const pName = document.getElementById('p-name').value || "N/A";
    const scoreText = `${document.getElementById('score-main').innerText}`;

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

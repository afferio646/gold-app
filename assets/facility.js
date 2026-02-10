
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

    // 3. Temperature
    let p3 = 0;
    const t = inputs.temp;
    if (t >= 41 && t <= 104) p3 = 10;
    else if ((t >= 32 && t < 41) || (t > 104 && t <= 113)) p3 = 5;
    else p3 = 0;
    score += p3;
    details.push({ factor: "Temperature in growth range (°F)", input: t, points: p3 });

    // 4. Wood moisture content MC%
    let p4 = 0;
    const mc = inputs.woodMc;
    if (!mc && mc !== 0) p4 = 0;
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

    // 6. Time since wetting
    let p6 = parseInt(inputs.timeWet) || 0;
    score += p6;
    details.push({ factor: "Time since wetting / intrusion", input: getText('f-time-wet'), points: p6 });

    // 7. Recent water event
    let p9 = parseInt(inputs.waterEvent) || 0;
    score += p9;
    details.push({ factor: "Recent water event (30 days)", input: getText('f-water-event'), points: p9 });

    // 8. Condensation / wetness (Moved to Observations in UI but part of Structural Score)
    let p7 = parseInt(inputs.condense) || 0;
    score += p7;
    details.push({ factor: "Condensation / wetness", input: getText('f-condense'), points: p7 });

    // 9. Visible mold present (Structural Score)
    let p8 = parseInt(inputs.moldVis) || 0;
    score += p8;
    details.push({ factor: "Visible mold present", input: getText('f-mold-vis'), points: p8 });

    if (score > 100) score = 100;
    return { score, details };
}

function getAirQualityScore(inputs, structuralScore) {
    let score = 0;
    const details = [];

    // 1. Visible mold extent (AQ Points)
    let p1 = 0;
    const moldVal = inputs.moldVisKey;
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

    // 5. Indoor RH persistence pattern (AQ Factor)
    // In UI, this is in "Moisture History"
    let p5 = parseInt(inputs.rhPersist) || 0;
    score += p5;
    details.push({ factor: "Indoor RH persistence pattern", input: getText('f-rh-persist'), points: p5 });

    // 6. Time since wetting (AQ Points map)
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

    // 7. Surface conditions supportive (Derived from Structural Score)
    let p7 = 0;
    if (structuralScore < 20) p7 = 0;
    else if (structuralScore <= 39) p7 = 3;
    else if (structuralScore <= 59) p7 = 6;
    else p7 = 10; // >= 60
    score += p7;
    details.push({ factor: "Surface conditions supportive", input: `Struct Score: ${structuralScore}`, points: p7 });

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

function getText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === 'SELECT') {
        return el.options[el.selectedIndex].text;
    }
    return el.value;
}

// --- MAIN PROCESS ---

function generateAnalysisPoints(inputs) {
    const points = [];

    // Core Environmental
    if (inputs.rh > 75) points.push(`<strong>High Humidity:</strong> Surface RH at ${inputs.rh}% indicates potential for microbial amplification.`);
    if (inputs.rhPattern && parseInt(inputs.rhPattern) > 0) points.push(`<strong>Moisture Persistence:</strong> Long-term moisture patterns detected.`);
    if (inputs.temp >= 41 && inputs.temp <= 104) points.push(`<strong>Growth Temperature:</strong> Current temperature (${inputs.temp}°F) supports fungal growth.`);

    // Moisture History
    if (inputs.waterEvent && parseInt(inputs.waterEvent) > 0) points.push(`<strong>Water Event:</strong> Recent significant water intrusion event noted.`);
    if (inputs.timeWetKey && ['3-7d', '8-30d', '>30d'].includes(inputs.timeWetKey)) points.push(`<strong>Saturation Duration:</strong> Materials have been wet for an extended period.`);

    // Observations
    if (inputs.moldVisKey && inputs.moldVisKey !== 'none') points.push(`<strong>Visible Growth:</strong> ${inputs.moldVisKey === 'wide' ? 'Widespread' : 'Localized'} fungal growth observed.`);
    if (inputs.odor && parseInt(inputs.odor) > 0) points.push(`<strong>Olfactory Signs:</strong> Musty odor detected, indicating active MVOCs.`);
    if (inputs.hvac && parseInt(inputs.hvac) > 8) points.push(`<strong>HVAC Risk:</strong> High potential for distribution via air handling systems.`);

    if (points.length === 0) points.push("No critical high-risk factors identified based on current inputs.");

    return points;
}

function generateRecoveryStrategy(inputs, projectInfo) {
    const isPorous = ['Drywall / paper-faced', 'Wood / framing', 'Composite / OSB', 'Carpet / padding', 'Insulation (fiberglass)', 'Ceiling tile'].includes(inputs.materialName);
    const materialAction = isPorous
        ? `Microbial colonization detected on Porous (${inputs.materialName}). Saturate application of GM6000 penetrating modifiers required.`
        : `Surface contamination on Non-Porous (${inputs.materialName}). Standard GM6000 surface treatment protocols apply.`;

    const strategy = `
        <div class="mt-8 mb-8 border-t border-gray-200 pt-8">
            <h4 class="font-bold text-lg uppercase border-l-4 border-[var(--g-cyan)] pl-4 mb-4 italic">SUBJECT: CERTIFIED RECOVERY STRATEGY</h4>
            <p class="text-sm text-gray-800 leading-relaxed mb-4">
                Based on the calculated environmental load for this <strong>${projectInfo.type}</strong> environment, traditional mechanical removal is insufficient. The following Goldmorr protocols are strictly mandated to achieve IICRC air quality standards:
            </p>
            <ul class="list-disc pl-5 space-y-3 text-sm text-gray-800 leading-relaxed">
                <li><strong>Environmental Factors:</strong> Relative Humidity of ${inputs.rh}% and water source identified as ${projectInfo.source} has compromised the building envelope.</li>
                <li><strong>Substrate Impact:</strong> ${materialAction}</li>
                <li><strong>Air Particle Clearance:</strong> Whole-structure non-mechanical air scrubbing via proprietary GM2000 fogging protocol is mandatory for particle neutralization.</li>
            </ul>
        </div>
    `;
    return strategy;
}

function runAuditProcess() {
    // 1. Gather Project Info
    const projectInfo = {
        type: document.getElementById('f-type').value,
        source: document.getElementById('f-source').value
    };

    // 2. Gather Risk Inputs
    const materialSelect = document.getElementById('f-material');
    const inputs = {
        rh: parseFloat(document.getElementById('f-rh').value) || 0,
        rhPattern: document.getElementById('f-rh-pattern').value,
        temp: parseFloat(document.getElementById('f-temp').value) || 0,
        woodMc: document.getElementById('f-wood-mc').value ? parseFloat(document.getElementById('f-wood-mc').value) : null,
        material: materialSelect.value,
        materialName: materialSelect.options[materialSelect.selectedIndex].text,
        timeWet: document.getElementById('f-time-wet').value,
        timeWetKey: document.getElementById('f-time-wet').selectedOptions[0].getAttribute('data-key'),
        waterEvent: document.getElementById('f-water-event').value,
        rhPersist: document.getElementById('f-rh-persist').value,
        moldVis: document.getElementById('f-mold-vis').value,
        moldVisKey: document.getElementById('f-mold-vis').selectedOptions[0].getAttribute('data-key'),
        condense: document.getElementById('f-condense').value,
        odor: document.getElementById('f-odor').value,
        hvac: document.getElementById('f-hvac').value,
        disturb: document.getElementById('f-disturb').value
    };

    // 3. Calculate Scores
    const struct = getStructuralScore(inputs);
    const aq = getAirQualityScore(inputs, struct.score);
    const structBand = getStructuralBand(struct.score);
    const aqBand = getAQBand(aq.score);

    // 4. Generate Legacy Project Analysis Text
    let legacyText = "";
    if(projectInfo.source.includes("Water Intrusion") || projectInfo.source.includes("Pipe Burst")) {
        legacyText = `<strong>Immediate Action Required:</strong> The identified water source (${projectInfo.source}) indicates a high saturation event. For this <strong>${projectInfo.type}</strong> facility, standard dehumidification may not be sufficient without substrate treatment.`;
    } else if (projectInfo.source.includes("Atmospheric")) {
        legacyText = `<strong>Environmental Control Alert:</strong> The primary source is Atmospheric / Humidity. This suggests a systemic building envelope or HVAC failure rather than a localized leak. Remediation must focus on air quality and long-term humidity control.`;
    } else {
        legacyText = `<strong>Assessment Note:</strong> Based on the facility type (${projectInfo.type}) and water source (${projectInfo.source}), follow standard Goldmorr protocols for surface neutralization.`;
    }

    // Add critical warning if scores are high
    if (struct.score >= 60 || aq.score >= 60) {
        legacyText += `<br><br><span class="text-red-400 font-bold">CRITICAL RISK:</span> The calculated risk scores indicate a severe fungal amplification potential. Occupant safety protocols should be reviewed immediately.`;
    }

    // 5. Update UI
    const analysisPoints = generateAnalysisPoints(inputs);
    const bulletList = `<ul class="list-disc pl-5 space-y-2 mt-4 text-gray-300 text-[12px] font-light leading-relaxed">
        ${analysisPoints.map(p => `<li>${p}</li>`).join('')}
    </ul>`;

    document.getElementById('legacy-text').innerHTML = legacyText + bulletList;

    // Stop Spinner
    const spinner = document.getElementById('score-spinner');
    if(spinner) spinner.classList.remove('animate-spin-slow');

    const statusEl = document.getElementById('f-status');
    statusEl.innerText = struct.score;
    statusEl.className = `text-4xl font-black uppercase ${structBand.color}`;

    document.getElementById('f-analysis-text').innerHTML = `
        <span class="${structBand.color} font-bold">${structBand.name} Structural Risk</span> <span class="text-gray-600 px-2">|</span>
        <span class="${aqBand.color} font-bold">${aqBand.name} Air Quality Impact</span>
    `;

    document.getElementById('f-res').classList.remove('hidden');

    // Store data for report
    window.currentReportData = { struct, aq, structBand, aqBand, inputs, projectInfo, legacyText, analysisPoints };
}

function openReportModal() {
    const data = window.currentReportData;
    if (!data) { runAuditProcess(); if (!window.currentReportData) return; }

    const { struct, aq, structBand, aqBand, projectInfo, legacyText, analysisPoints, inputs } = window.currentReportData;
    const pName = document.getElementById('p-name').value || "N/A";
    const photoCount = document.getElementById('f-photos').files.length;

    const reportBullets = `<ul class="list-disc pl-5 space-y-2 mt-4 text-sm text-gray-800 leading-relaxed">
        ${analysisPoints ? analysisPoints.map(p => `<li>${p}</li>`).join('') : ''}
    </ul>`;

    const recoveryStrategy = generateRecoveryStrategy(inputs, projectInfo);

    // Generate Tables
    const rowBuilder = (d) => `
        <tr class="border-b border-gray-200 text-xs">
            <td class="py-2 font-medium text-gray-700 w-1/2">${d.factor}</td>
            <td class="py-2 text-gray-600">${d.input}</td>
            <td class="py-2 text-right font-bold text-gray-900">${d.points}</td>
        </tr>
    `;
    const structRows = struct.details.map(rowBuilder).join('');
    const aqRows = aq.details.map(rowBuilder).join('');

    document.getElementById('modal-content').innerHTML = `
        <!-- Project Context -->
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-6 border border-gray-200 rounded mb-8">
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Project / Facility</p><p class="font-bold text-lg">${pName}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Facility Type</p><p class="font-bold">${projectInfo.type}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Water Source</p><p class="font-bold">${projectInfo.source}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Date</p><p class="font-bold">${new Date().toLocaleDateString()}</p></div>
        </div>

        <!-- Analysis Text -->
        <div class="px-2 mb-8">
            <p class="font-bold text-lg uppercase border-l-4 border-[var(--g-cyan)] pl-4 mb-4 italic">SUBJECT: PROJECT ANALYSIS STRATEGY</p>
            <div class="text-sm text-gray-800 leading-relaxed space-y-2">
                ${legacyText}
                ${reportBullets}
            </div>
             <p class="text-[11px] text-gray-500 italic mt-4">Attached Evidence: ${photoCount} Photo(s) (See Appendix)</p>
        </div>

        <!-- Certified Recovery Strategy -->
        ${recoveryStrategy}

        <!-- Scores Summary -->
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-blue-50 p-4 rounded border border-blue-100">
                <h4 class="font-bold text-sm uppercase text-blue-800 mb-2">Structural Risk Score</h4>
                <div class="flex justify-between items-end">
                    <span class="text-3xl font-black ${structBand.color}">${struct.score}</span>
                    <span class="text-sm font-bold uppercase ${structBand.color}">${structBand.name}</span>
                </div>
            </div>
            <div class="bg-blue-50 p-4 rounded border border-blue-100">
                <h4 class="font-bold text-sm uppercase text-blue-800 mb-2">Air Quality Impact Score</h4>
                <div class="flex justify-between items-end">
                    <span class="text-3xl font-black ${aqBand.color}">${aq.score}</span>
                    <span class="text-sm font-bold uppercase ${aqBand.color}">${aqBand.name}</span>
                </div>
            </div>
        </div>

        <!-- Detailed Tables -->
        <div class="mb-8">
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2 text-gray-700">Structural Risk Factors</h3>
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
            <h3 class="font-bold text-sm uppercase bg-gray-100 p-2 mb-2 text-gray-700">Air Quality Impact Factors</h3>
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
    alert("Report exported successfully!");
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

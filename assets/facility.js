
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

    // 4. Update Result Card (Dual Scores)
    // Update Text Sections
    document.getElementById('legacy-text').innerHTML = legacyText;
    document.getElementById('analysis-bullets').innerHTML = bulletList;

    // Update Structural Score
    document.getElementById('score-struct-val').innerText = struct.score;
    document.getElementById('score-struct-val').className = `text-3xl font-black mb-1 ${structBand.color}`;

    const sText = document.getElementById('struct-text');
    sText.innerText = structBand.name;
    sText.className = `text-[8px] uppercase tracking-widest font-bold text-center ${structBand.color}`;

    // Update AQ Score
    document.getElementById('score-aq-val').innerText = aq.score;
    document.getElementById('score-aq-val').className = `text-3xl font-black mb-1 ${aqBand.color}`;

    const aqText = document.getElementById('aq-text');
    aqText.innerText = aqBand.name;
    aqText.className = `text-[8px] uppercase tracking-widest font-bold text-center ${aqBand.color}`;

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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4 border-b border-gray-200 pb-4">
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Project / Facility</p><p class="font-bold text-lg text-gray-900">${pName}</p></div>
                <div><p class="text-[10px] uppercase font-bold text-gray-400">Facility Type</p><p class="font-bold text-gray-900">${projectInfo.type}</p></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <p><strong>Assessment Note:</strong> Based on the facility type (${projectInfo.type}) and water source (${projectInfo.source}), follow standard Goldmorr protocols for surface neutralization..</p>
                ${analysisBullets}
                <p class="text-[11px] text-gray-400 italic mt-2">Attached Evidence: ${photoCount} Photo(s) (See Appendix)</p>
            </div>
        </div>
    `;

    // 4. Certified Recovery Strategy (Second Section)
    const recoveryBlock = generateRecoveryStrategy(inputs, projectInfo);

    // 5. Score Summary (Colored Boxes)
    const scoreBlock = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
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
        <div class="mb-8">
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

    // New Detailed Legend
    const legendBlock = `
        <div class="mt-8 pt-6 border-t border-gray-200 break-inside-avoid">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Goldmorr Environmental Risk Classification™</h3>
            <p class="text-xs text-gray-500 mb-4">Fungal Risk Assessment – Legend & Interpretation Guide</p>

            <!-- Color Bar -->
            <div class="grid grid-cols-5 text-center text-[10px] font-bold text-white mb-6 uppercase tracking-wider">
                <div class="bg-green-600 py-2">Minimal</div>
                <div class="bg-yellow-400 py-2 text-black">Guarded</div>
                <div class="bg-orange-500 py-2">Elevated</div>
                <div class="bg-red-600 py-2">High</div>
                <div class="bg-red-900 py-2">Severe</div>
            </div>

            <!-- Structural Risk Table -->
            <h4 class="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Structural Risk Score Legend</h4>
            <table class="w-full text-xs text-left text-gray-600 mb-6 border border-gray-300">
                <thead class="text-[10px] text-gray-700 uppercase bg-gray-100 font-bold">
                    <tr>
                        <th class="px-3 py-2 border border-gray-300 w-1/6">Score Range</th>
                        <th class="px-3 py-2 border border-gray-300 w-1/6">Rating</th>
                        <th class="px-3 py-2 border border-gray-300">Interpretation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">0–15</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-green-600">Minimal</td><td class="px-3 py-2">No significant structural fungal risk detected</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">16–30</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-yellow-600">Guarded</td><td class="px-3 py-2">Early fungal activity or favorable growth conditions possible</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">31–50</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-orange-600">Elevated</td><td class="px-3 py-2">Active fungal growth likely present</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">51–75</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-red-600">High</td><td class="px-3 py-2">Significant structural fungal contamination present</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">76–100</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-red-900">Severe</td><td class="px-3 py-2">Extensive fungal amplification present</td></tr>
                </tbody>
            </table>

            <!-- Air Quality Table -->
            <h4 class="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Air Quality Impact Score Legend</h4>
            <table class="w-full text-xs text-left text-gray-600 mb-2 border border-gray-300">
                <thead class="text-[10px] text-gray-700 uppercase bg-gray-100 font-bold">
                    <tr>
                        <th class="px-3 py-2 border border-gray-300 w-1/6">Score Range</th>
                        <th class="px-3 py-2 border border-gray-300 w-1/6">Rating</th>
                        <th class="px-3 py-2 border border-gray-300">Interpretation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">0–20</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-green-600">Clean</td><td class="px-3 py-2">Air quality within normal environmental range</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">21–40</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-blue-500">Mild Impact</td><td class="px-3 py-2">Slight airborne fungal elevation possible</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">41–60</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-yellow-600">Moderate Impact</td><td class="px-3 py-2">Elevated airborne fungal presence likely</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">61–80</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-orange-600">High Impact</td><td class="px-3 py-2">Significant airborne contamination present</td></tr>
                    <tr class="border-b border-gray-200"><td class="px-3 py-2 border-r border-gray-200 font-bold">81–100</td><td class="px-3 py-2 border-r border-gray-200 font-bold text-red-900">Severe</td><td class="px-3 py-2">Extensive airborne fungal amplification present</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // New Footer Sources Block
    const footerBlock = `
        <div class="mt-8 pt-4 border-t border-gray-200">
             <p class="text-[9px] text-gray-500"><strong>Sources (for internal documentation):</strong> EPA mold guidance (RH control); ASHRAE 160 (surface RH/time criteria); wood moisture content guidance (~20% boundary).</p>
        </div>
    `;

    document.getElementById('modal-content').innerHTML = `
        ${contextBlock}
        ${analysisBlock}
        ${recoveryBlock}
        ${scoreBlock}
        ${tablesBlock}
        ${legendBlock}
        ${footerBlock}
    `;

    document.getElementById('report-modal').classList.remove('hidden');

    // --- NEW: Trigger lead generation immediately when they view the report ---
    triggerEarlyLeadGeneration();
}

function triggerEarlyLeadGeneration() {
    // Only fire once per session to avoid duplicate leads if they open/close the modal
    if(window.hasGeneratedLeadForThisSession) return;

    const user = API.getSettings();
    if(!user) return; // Silent fail if not registered yet

    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source') || 'General';
    const pName = document.getElementById('p-name').value || "N/A";
    const scoreText = `S:${document.getElementById('score-struct-val').innerText} / AQ:${document.getElementById('score-aq-val').innerText}`;

    const reportData = {
        user: user,
        project: {
            name: pName,
            type: "Facility Audit"
        },
        appType: 'Facility Guard',
        score: scoreText,
        source: source,
        timestamp: new Date().toLocaleString(),
        details: window.currentReportData
    };

    // Save early lead
    API.saveReport(reportData);
    window.hasGeneratedLeadForThisSession = true;
}

async function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    const pName = document.getElementById('p-name').value || 'Unnamed Project';
    const cleanName = pName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `facility_guard_report_${cleanName}_${Date.now()}.pdf`;

    // Visual feedback
    const btn = document.querySelector('button[onclick="uploadReport()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Generating PDF...';
    btn.disabled = true;

    // Grab the modal and the content block
    const modalWrapper = document.getElementById('report-modal');
    const element = modalWrapper.querySelector('.max-w-4xl');

    // Store original styles so we can put them back
    const originalWrapperCss = modalWrapper.style.cssText;
    const originalWrapperClass = modalWrapper.className;

    // Temporarily hide action buttons
    const actionButtons = element.querySelector('.flex.flex-col.items-center.gap-4.mt-12');
    if(actionButtons) actionButtons.style.display = 'none';

    // 1. Force the Modal to be a normal, flat document block
    modalWrapper.className = 'absolute top-0 left-0 w-full min-h-screen bg-white z-[9999] flex justify-center p-4';
    window.scrollTo(0, 0);

    try {
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const blob = await html2pdf().set(opt).from(element).output('blob');
        const uploadResult = await API.uploadPDF(blob, fileName);

        if (uploadResult && window.currentSessionLeadId) {
            await API.updateLeadPDF(window.currentSessionLeadId, uploadResult);
            console.log("PDF URL attached to lead:", window.currentSessionLeadId);
        }

        // Trigger Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();

        alert(`Report for "${pName}" exported and saved successfully!`);
    } catch (err) {
        console.error("PDF Generation Error:", err);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        // Restore Modal Styles
        modalWrapper.className = originalWrapperClass;
        modalWrapper.style.cssText = originalWrapperCss;
        if(actionButtons) actionButtons.style.display = 'flex';

        btn.innerHTML = originalText;
        btn.disabled = false;

        // Hide Modal
        modalWrapper.classList.add('hidden');
    }
}

function saveUserSettings() {
    const name = document.getElementById('set-name').value;
    const company = document.getElementById('set-company').value;
    const email = document.getElementById('set-email').value;
    if(!name || !company || !email) { alert("All fields required."); return; }

    // Save with userType 'facility' to enable smart redirection
    API.saveSettings({ name, company, email, userType: 'facility' });

    // Show Certification Complete Step
    document.getElementById('cert-step-1').classList.add('hidden');
    document.getElementById('cert-step-2').classList.remove('hidden');

    // Smart Highlight: Add a "Recommended" border to the detected device AND Hide irrelevant one
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    // Auto-Trigger Install Prompt on Android if available (Seamless Flow)
    if (typeof triggerInstallFlow === 'function' && !isIOS) {
        setTimeout(() => {
            triggerInstallFlow();
        }, 1000); // Slight delay to let modal transition finish
    }

    const iosEl = document.getElementById('ios-instruct');
    const androidEl = document.getElementById('android-instruct');
    const container = iosEl ? iosEl.parentElement : null;

    if (isIOS && iosEl) {
        // Highlight iOS
        iosEl.classList.remove('border-gray-700');
        iosEl.classList.add('border-[var(--g-cyan)]', 'bg-slate-800', 'shadow-[0_0_15px_rgba(34,211,238,0.15)]');
        iosEl.innerHTML += `<div class="mt-2 text-[8px] uppercase font-bold text-[var(--g-cyan)] tracking-widest animate-pulse">Detected Device</div>`;

        // Hide Android & Center
        if(androidEl) androidEl.classList.add('hidden');
        if(container) {
            container.classList.remove('grid-cols-2');
            container.classList.add('flex', 'justify-center');
        }
    } else if (isAndroid && androidEl) {
        // Highlight Android
        androidEl.classList.remove('border-gray-700');
        androidEl.classList.add('border-[var(--g-cyan)]', 'bg-slate-800', 'shadow-[0_0_15px_rgba(34,211,238,0.15)]');
        androidEl.innerHTML += `<div class="mt-2 text-[8px] uppercase font-bold text-[var(--g-cyan)] tracking-widest animate-pulse">Detected Device</div>`;

        // Hide iOS & Center
        if(iosEl) iosEl.classList.add('hidden');
        if(container) {
            container.classList.remove('grid-cols-2');
            container.classList.add('flex', 'justify-center');
        }
    }
}

function closeCertification() {
    toggleModal('settings-modal', false);
}

function openSettings() {
    // FORCE RESET MODAL STATE (Fix: Ensure Form shows, not "Save App" instructions)
    document.getElementById('cert-step-1').classList.remove('hidden');
    document.getElementById('cert-step-2').classList.add('hidden');

    const user = API.getSettings();
    if(user) {
        document.getElementById('set-name').value = user.name;
        document.getElementById('set-company').value = user.company;
        document.getElementById('set-email').value = user.email;
    }

    // Inject Reset Data Button if not present
    const modalBody = document.querySelector('#cert-step-1 .space-y-4');
    if(modalBody && !document.getElementById('reset-data-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-data-btn';
        resetBtn.innerText = "Reset App Registration (Fix Issues)";
        resetBtn.className = "w-full border border-red-500 text-red-500 font-bold py-3 rounded-xl text-[9px] uppercase tracking-widest mt-4 hover:bg-red-900/20";
        resetBtn.onclick = () => {
            if(confirm("This will clear your registration and saved settings. Continue?")) {
                localStorage.clear();
                window.location.reload();
            }
        };
        modalBody.appendChild(resetBtn);
    }

    toggleModal('settings-modal', true);
}

function handleHomeClick() {
    // Check if launched from Hub/Admin (via ?hub=true)
    const urlParams = new URLSearchParams(window.location.search);
    const isHub = urlParams.get('hub') === 'true';

    if (isHub) {
        if(confirm("Return to Admin Hub? Any unsaved data will be lost.")) {
            // Go back to the dedicated Admin page
            window.location.href = 'admin.html';
        }
    } else {
        // Normal behavior: Reset Form
        resetForm();
    }
}

function resetForm() {
    if(confirm("Start a new assessment? All current data will be cleared.")) {
        // Clear Inputs
        document.getElementById('p-name').value = '';
        document.getElementById('f-photos').value = '';
        document.getElementById('f-photo-count').innerText = 'No photos selected';

        document.getElementById('f-type').selectedIndex = 0;
        document.getElementById('f-source').selectedIndex = 0;
        document.getElementById('f-mold-growth').selectedIndex = 0;
        document.getElementById('f-surface-type').selectedIndex = 0;
        document.getElementById('f-moisture-hist').selectedIndex = 0;
        document.getElementById('f-sensory').selectedIndex = 0;
        document.getElementById('f-hvac-risk').selectedIndex = 0;

        document.getElementById('f-rh').value = '';
        document.getElementById('f-temp').value = '';

        // Hide Results
        document.getElementById('f-res').classList.add('hidden');
        document.getElementById('report-modal').classList.add('hidden');

        // Clear stored data
        window.currentReportData = null;
        window.hasGeneratedLeadForThisSession = false;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


// --- MEMBER SUITE SPECIFIC LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // Shared initialization
    const user = API.getSettings();
    if(!user && document.getElementById('settings-modal')) {
        toggleModal('settings-modal', true);
    }

    // Only run on member page
    if (!document.getElementById('m-jobtype')) return;

    // Auto-calc cubic feet
    const fogInput = document.getElementById('m-fog-sqft');
    const ceilInput = document.getElementById('m-ceiling');

    const updateCubic = () => {
        const f = parseFloat(fogInput.value) || 0;
        const c = parseFloat(ceilInput.value) || 0;
        document.getElementById('m-cubic').value = (f * c).toFixed(0);
    };

    if(fogInput && ceilInput) {
        fogInput.addEventListener('input', updateCubic);
        ceilInput.addEventListener('input', updateCubic);
    }

    // Auto-calc COGS listeners
    ['c-product', 'c-techs', 'c-hours', 'c-rate', 'c-misc'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calculateBid);
    });
});

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

function toggleAtticDropdown() {
    const jobTypeSelect = document.getElementById('m-jobtype');
    const selectedOptions = Array.from(jobTypeSelect.selectedOptions).map(o => o.value);
    const atticSection = document.getElementById('attic-section');

    if(selectedOptions.includes('Attic')) {
        atticSection.classList.remove('hidden');
    } else {
        atticSection.classList.add('hidden');
    }
}

function calculateProtocol() {
    // 1. Gather Inputs
    const moldSq = parseFloat(document.getElementById('m-mold-sqft').value) || 0;

    // Coverage Rates (Sq Ft per Gal): Light=250, Medium=165, Heavy=125
    // The dropdown value IS the coverage rate now.
    const coverageRate = parseFloat(document.getElementById('m-density').value) || 250;

    // Substrate Multiplier: Low(0.5), High(1.0), Semi(1.25), Non(0.8)
    const substrateMult = parseFloat(document.getElementById('m-porosity').value) || 1.0;

    // Attic Multiplier
    let atticMult = 1.0;
    const jobTypes = Array.from(document.getElementById('m-jobtype').selectedOptions).map(o => o.value);
    if (jobTypes.includes('Attic')) {
        atticMult = parseFloat(document.getElementById('m-attic-type').value) || 1.0;
    }

    // Surface Condition (Hardcoded to Smooth=1.0 per instructions unless added later, assuming standard 1.0 for now as no dropdown exists)
    // "Tradeshow Mode Defaults: Surface Condition = Smooth" -> 1.0
    const surfaceMult = 1.0;

    // Buffer (Hardcoded to 5% per "Tradeshow Mode Defaults")
    const buffer = 1.05;

    // --- GM6000 CALCULATION ---
    // Formula: (Area / Coverage) * Substrate * Attic * Surface * Buffer
    // Note: Attic multiplier logic wasn't explicitly defined in formula but said "multiplier for attic selection".
    // Applying it to the chemical usage makes the most sense (harder to access/apply = more waste/usage).

    let baseGal = moldSq / coverageRate;
    let adjustedGal = baseGal * substrateMult * atticMult * surfaceMult;
    let finalGal = adjustedGal * buffer;

    // Rounding: Estimated Use (0.1), Stock (Round UP to nearest 0.25)
    const estUse = parseFloat(finalGal.toFixed(1));
    const stockUse = Math.ceil(finalGal / 0.25) * 0.25;


    // --- FOGGING CALCULATION ---
    const cubic = parseFloat(document.getElementById('m-cubic').value) || 0;
    const agentType = document.getElementById('m-agent').value;

    // Coverage: GM2000 = 60,000, GM Thermal = 128,000
    let fogCoverage = 60000;
    if (agentType === 'GM Thermal') fogCoverage = 128000;

    let fogBase = cubic / fogCoverage;
    let fogFinal = fogBase * buffer; // 5% buffer

    // Display Rules
    // GM6000
    let gm6Text = `${estUse} Gal`;
    if (estUse < 1.0) {
        const oz = (estUse * 128).toFixed(1);
        gm6Text = `${estUse} Gal (${oz} oz)`;
    } else {
        // Optional oz in parens for >= 1
        // gm6Text = `${estUse} Gal`; // Keeping simple per primary rule
    }

    // Fogging
    let fogText = `${fogFinal.toFixed(2)} Gal`;
    if (fogFinal < 1.0) {
         const fOz = (fogFinal * 128).toFixed(1);
         fogText = `${fOz} oz (${fogFinal.toFixed(2)} Gal)`;
    }

    // Update DOM
    document.getElementById('res-gm6').innerText = gm6Text;
    document.getElementById('res-fog').innerText = fogText;

    // Update Profitability Product Cost Estimate
    // Prices (Configurable, using placeholders): GM6000=$120, GM2000=$60, Thermo=$80
    let fogPrice = 60;
    if(agentType === 'GM Thermal') fogPrice = 80;

    const estCost = (stockUse * 120) + (fogFinal * fogPrice);
    document.getElementById('c-product').value = estCost.toFixed(2);

    // Show Results
    document.getElementById('m-results').classList.remove('hidden');

    const densityText = document.getElementById('m-density').options[document.getElementById('m-density').selectedIndex].text;

    document.getElementById('member-analysis-text').innerHTML = `
        <p>• <strong>Surface Protocol:</strong> Apply GM6000 (stock ${stockUse} gal) for ${densityText} growth on ${moldSq} sq ft.</p>
        <p>• <strong>Air Correction:</strong> Fog ${cubic} cubic ft with ${agentType} to neutralize particulate.</p>
        <p class="text-[10px] text-gray-500 mt-2">*Calculations include substrate porosity (${substrateMult}x) and attic (${atticMult}x) factors with 5% buffer.</p>
    `;

    calculateBid(); // Update costs
}

function calculateBid() {
    // Get inputs
    const product = parseFloat(document.getElementById('c-product').value) || 0;
    const techs = parseFloat(document.getElementById('c-techs').value) || 0;
    const hours = parseFloat(document.getElementById('c-hours').value) || 0;
    const rate = parseFloat(document.getElementById('c-rate').value) || 0;
    const misc = parseFloat(document.getElementById('c-misc').value) || 0;

    const laborTotal = techs * hours * rate;
    const totalCOGS = product + laborTotal + misc;

    document.getElementById('p-total-cogs').innerText = '$' + totalCOGS.toFixed(2);

    // Margin
    const select = document.getElementById('p-markup-select');
    let divisor;
    let labelText;

    if(select.value === 'custom') {
        document.getElementById('custom-markup-container').classList.remove('hidden');
        const customPct = parseFloat(document.getElementById('p-custom-val').value) || 0;
        divisor = (100 - customPct) / 100;
        labelText = `Custom ${customPct}% Gross Margin`;
    } else {
        document.getElementById('custom-markup-container').classList.add('hidden');
        divisor = parseFloat(select.value);
        const displayPct = Math.round((1 - divisor) * 100);
        labelText = `Guarding ${displayPct}% Gross Margin`;
        if(divisor === 0.311) labelText = `Guarding 68.9% Certified Member Margin`;
    }

    if(divisor <= 0.01) divisor = 1; // prevent divide by zero

    const bid = totalCOGS / divisor;
    document.getElementById('p-bid').innerText = '$' + bid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('p-margin-label').innerText = labelText;
}

function openMemberReportModal() {
    const user = API.getSettings();
    if(!user) { toggleModal('settings-modal', true); return; }

    const pName = document.getElementById('p-name').value || "N/A";
    const contact = document.getElementById('p-contact').value || "N/A";
    const facilityType = document.getElementById('m-type').value;
    const jobTypes = Array.from(document.getElementById('m-jobtype').selectedOptions).map(o => o.value).join(", ");
    const moldSq = document.getElementById('m-mold-sqft').value || "0";
    const cubic = document.getElementById('m-cubic').value || "0";
    const agent = document.getElementById('m-agent').value;

    const bid = document.getElementById('p-bid').innerText;
    const cogs = document.getElementById('p-total-cogs').innerText;

    const gm6 = document.getElementById('res-gm6').innerText;
    const fog = document.getElementById('res-fog').innerText;

    const photoInput = document.getElementById('p-photos');
    const photoCount = photoInput.files.length;
    const photoText = photoCount > 0 ? `${photoCount} Photos Attached` : "No Photos Attached";

    // Optional Fields
    const rh = document.getElementById('m-rh').value;
    const temp = document.getElementById('m-temp').value;
    let envData = "";
    if(rh || temp) {
        envData = `<li class="flex justify-between border-b border-gray-100 pb-2"><span>Environmental:</span> <span class="font-bold">${rh ? 'RH: '+rh+'% ' : ''}${temp ? 'Temp: '+temp+'°F' : ''}</span></li>`;
    }

    document.getElementById('modal-content').innerHTML = `
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-6 border border-gray-200 rounded mb-8">
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Project Name</p><p class="font-bold text-lg">${pName}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Contact</p><p class="font-bold">${contact}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Facility Type</p><p class="font-bold">${facilityType}</p></div>
            <div><p class="text-[10px] uppercase font-bold text-gray-400">Job Scope</p><p class="font-bold">${jobTypes}</p></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
                <p class="font-bold text-lg uppercase border-b-2 border-[var(--g-cyan)] pb-2 mb-4">Diagnostics</p>
                <ul class="text-sm space-y-3">
                    <li class="flex justify-between border-b border-gray-100 pb-2"><span>Visible Mold Load:</span> <span class="font-bold">${moldSq} Sq Ft</span></li>
                    <li class="flex justify-between border-b border-gray-100 pb-2"><span>Treatment Volume:</span> <span class="font-bold">${cubic} Cu Ft</span></li>
                    ${envData}
                    <li class="flex justify-between border-b border-gray-100 pb-2"><span>GM6000 Dosage:</span> <span class="font-bold text-[var(--g-cyan)]">${gm6}</span></li>
                    <li class="flex justify-between border-b border-gray-100 pb-2"><span>Fogging Agent:</span> <span class="font-bold text-[var(--g-cyan)]">${fog} (${agent})</span></li>
                </ul>
            </div>
            <div>
                 <p class="font-bold text-lg uppercase border-b-2 border-black pb-2 mb-4">Financials</p>
                 <ul class="text-sm space-y-3">
                    <li class="flex justify-between border-b border-gray-100 pb-2"><span>Total Project COGS:</span> <span class="font-bold">${cogs}</span></li>
                    <li class="flex justify-between border-b border-gray-100 pb-2 items-center">
                        <span>Suggested Retail Bid:</span>
                        <span class="font-black text-2xl text-green-600">${bid}</span>
                    </li>
                </ul>
            </div>
        </div>

        <div class="bg-gray-100 p-4 rounded text-center">
            <p class="text-[10px] uppercase font-bold text-gray-500 mb-2">Attached Documentation</p>
            <p class="font-bold text-sm">${photoText}</p>
            ${photoCount > 0 ? '<p class="text-[10px] text-gray-400 italic mt-1">(Photos will be appended to final PDF)</p>' : ''}
        </div>
    `;

    document.getElementById('report-modal').classList.remove('hidden');
}

function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    // Gather all data
    const reportData = {
        user: user,
        project: {
            name: document.getElementById('p-name').value,
            contact: document.getElementById('p-contact').value,
            email: document.getElementById('p-email').value,
            phone: document.getElementById('p-phone').value
        },
        inputs: {
            type: document.getElementById('m-type').value,
            jobTypes: Array.from(document.getElementById('m-jobtype').selectedOptions).map(o => o.value),
            moldSq: document.getElementById('m-mold-sqft').value,
            cubic: document.getElementById('m-cubic').value,
            rh: document.getElementById('m-rh').value,
            temp: document.getElementById('m-temp').value
        },
        financials: {
            cogs: document.getElementById('p-total-cogs').innerText,
            bid: document.getElementById('p-bid').innerText
        },
        appType: 'Member Suite',
        hasPhotos: document.getElementById('p-photos').files.length > 0
    };

    // Save via API
    API.saveReport(reportData);

    // Close modal
    document.getElementById('report-modal').classList.add('hidden');

    // Show Success Alert (since text was removed from screen)
    alert(`Report for "${reportData.project.name}" uploaded successfully! \nThe PDF report has been sent to ${user.email}.`);
}

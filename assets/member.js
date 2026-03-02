
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
    const envelopeInput = document.getElementById('m-envelope-sqft'); // "Square Ft. (Footprint)"
    const fogInput = document.getElementById('m-fog-sqft');
    const ceilInput = document.getElementById('m-ceiling');

    // Sync Footprint to Fogging Area
    if(envelopeInput && fogInput) {
        envelopeInput.addEventListener('input', () => {
            fogInput.value = envelopeInput.value;
            updateCubic();
        });
    }

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

    // Save with userType 'member' (optional, for future use)
    API.saveSettings({ name, company, email, userType: 'member' });

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
    // FORCE RESET MODAL STATE
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

    // New Surface Condition: Smooth(1.0), Rough(1.2)
    const surfaceMult = parseFloat(document.getElementById('m-surface-cond').value) || 1.0;

    // New Buffer: 0%(1.0), 5%(1.05), 10%(1.10)
    const buffer = parseFloat(document.getElementById('m-waste-buffer').value) || 1.0;

    // --- GM6000 CALCULATION ---
    // Formula: (Area / Coverage) * Substrate * Attic * Surface * Buffer

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
        gm6Text = `${estUse} Gal<br>(${oz} oz)`;
    }

    // Fogging
    let fogText = `${fogFinal.toFixed(2)} Gal`;
    if (fogFinal < 1.0) {
         const fOz = (fogFinal * 128).toFixed(1);
         fogText = `${fOz} oz<br>(${fogFinal.toFixed(2)} Gal)`;
    }

    // Update DOM
    document.getElementById('res-gm6').innerHTML = gm6Text;
    document.getElementById('res-fog').innerHTML = fogText;

    // Update Profitability Product Cost Estimate
    // New Pricing Logic (Feb 25)
    // GM6000: $58.70/gal (Includes Hypochlorite)
    const gm6000Price = 58.70;
    const gm6Cost = finalGal * gm6000Price; // Using EXACT usage for cost, not stock rounding (unless client implies otherwise, usually COGS is exact usage)
    // Note: Re-reading instructions "stock use" vs "calculated use".
    // Usually COGS is based on what you consume.
    // "gm6000_cost = rtu_gallons_required * 58.70" -> This implies exact gallons.

    // Fogging Pricing
    // GM2000: $0.00343 per cu ft
    // GM Thermo: $0.00336 per cu ft
    // Formula: cubic_ft * Rate (Note: Formula uses cubic_ft input, not gallons)
    let fogCost = 0;
    if (agentType === 'GM Thermal') {
        fogCost = cubic * 0.00336;
    } else {
        fogCost = cubic * 0.00343;
    }

    const estCost = gm6Cost + fogCost;
    document.getElementById('c-product').value = estCost.toFixed(2);

    // Show Results
    document.getElementById('m-results').classList.remove('hidden');

    const densityText = document.getElementById('m-density').options[document.getElementById('m-density').selectedIndex].text;

    // Disclaimer about Buffer
    const bufferPct = (buffer - 1) * 100;

    document.getElementById('member-analysis-text').innerHTML = `
        <p>• <strong>Surface Protocol:</strong> Apply GM6000 (stock ${stockUse} gal) for ${densityText} growth on ${moldSq} sq ft.</p>
        <p>• <strong>Air Correction:</strong> Fog ${cubic} cubic ft with ${agentType} to neutralize particulate.</p>
        <p class="text-[10px] text-gray-500 mt-2">*Calculations include porosity (${substrateMult}x), surface (${surfaceMult}x) and buffer (${Math.round(bufferPct)}%) factors.</p>
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

    // --- NEW: Trigger lead generation immediately when they calculate the bid ---
    // (This covers the case where they just look at the price and leave)
    // We only want to trigger this if they have actually entered square footage
    // to avoid triggering a blank lead on initial load
    const moldSq = parseFloat(document.getElementById('m-mold-sqft').value) || 0;
    if (moldSq > 0) {
        triggerEarlyLeadGenerationMember();
    }
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

        <div class="bg-gray-100 p-4 rounded text-center mb-10">
            <p class="text-[10px] uppercase font-bold text-gray-500 mb-2">Attached Documentation</p>
            <p class="font-bold text-sm">${photoText}</p>
            ${photoCount > 0 ? '<p class="text-[10px] text-gray-400 italic mt-1">(Photos will be appended to final PDF)</p>' : ''}
        </div>

        <div class="text-[10px] text-gray-500 mb-4 border-t border-gray-200 pt-4">
            <strong>Sources (for internal documentation):</strong> EPA mold guidance (RH control); ASHRAE 160 (surface RH/time criteria); wood moisture content guidance (~20% boundary).
        </div>

        <!-- Project Protocols Summary -->
        <div class="border-t-4 border-gray-200 pt-8 break-inside-avoid">
            <h3 class="text-xl font-black uppercase text-gray-800 mb-6 tracking-widest text-center">Project Protocols Summary</h3>

            <div class="space-y-6 text-sm text-gray-700 leading-relaxed">

                <div>
                    <h4 class="font-bold text-[var(--g-cyan)] uppercase mb-2 text-xs tracking-wider">1. Pre-Application Preparation</h4>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Identify and document visible mold growth areas.</li>
                        <li>Perform necessary containment measures as appropriate to project scope.</li>
                        <li>Remove loose debris and physically address heavily contaminated materials where required.</li>
                        <li>Ensure all HVAC systems are evaluated prior to treatment.</li>
                        <li>Seal open drains, plumbing traps, and fireplace openings prior to fogging application.</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-[var(--g-cyan)] uppercase mb-2 text-xs tracking-wider">2. Surface Treatment – GM6000 Application</h4>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Apply GM6000 evenly to affected surfaces based on calculated coverage rate.</li>
                        <li>Ensure full surface contact without excessive runoff.</li>
                        <li>Adjust technique based on substrate type and surface texture.</li>
                        <li>Allow appropriate dwell time per training guidelines.</li>
                        <li>Perform light agitation or wipe-down when required by material condition.</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-[var(--g-cyan)] uppercase mb-2 text-xs tracking-wider">3. Air Volume Treatment – Fogging Application</h4>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Confirm cubic footage of treatment area.</li>
                        <li>Utilize selected fogging equipment (ULV for GM2000 or Thermal Electric Fogger for GM Thermo).</li>
                        <li>Apply calculated volume of fogging agent evenly throughout space.</li>
                        <li>Maintain closed environment during and immediately after application.</li>
                        <li>Avoid active air movement during initial dispersion phase.</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-[var(--g-cyan)] uppercase mb-2 text-xs tracking-wider">4. Post-Application Procedure</h4>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Allow minimum 24 hours prior to post-remediation testing.</li>
                        <li>Do not disturb treated surfaces prematurely.</li>
                        <li>Conduct IAQ verification testing where required.</li>
                        <li>Confirm acceptable particulate and environmental readings prior to re-occupancy.</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-[var(--g-cyan)] uppercase mb-2 text-xs tracking-wider">5. Documentation & Verification</h4>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Record total chemistry used.</li>
                        <li>Document growth severity, substrate conditions, and environmental factors.</li>
                        <li>Maintain job file documentation consistent with Goldmorr protocol standards.</li>
                    </ul>
                </div>

                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                    <h4 class="font-bold text-blue-800 uppercase mb-1 text-xs tracking-wider">Field Advisory</h4>
                    <ul class="list-disc pl-5 space-y-1 text-blue-700 text-xs italic">
                        <li>The estimating tool provides standardized projections based on Goldmorr coverage testing and field averages.</li>
                        <li>Actual product usage may vary depending on technician technique, equipment calibration, surface porosity, and environmental conditions.</li>
                        <li>Buffer selection allows adjustment for field variability.</li>
                    </ul>
                </div>

            </div>
        </div>
    `;

    document.getElementById('report-modal').classList.remove('hidden');

    // Fallback trigger in case they opened report without changing calc inputs
    triggerEarlyLeadGenerationMember();
}

function triggerEarlyLeadGenerationMember() {
    // Only fire once per session to avoid duplicate leads
    if(window.hasGeneratedLeadForThisSession) return;

    const user = API.getSettings();
    if(!user) return; // Silent fail if not registered yet

    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source') || 'General';

    // Gather all data
    const reportData = {
        user: user,
        project: {
            name: document.getElementById('p-name').value || 'Unnamed Project',
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
        source: source,
        hasPhotos: document.getElementById('p-photos').files && document.getElementById('p-photos').files.length > 0
    };

    // Save early lead
    API.saveReport(reportData);
    window.hasGeneratedLeadForThisSession = true;
}

function uploadReport() {
    const user = API.getSettings();
    if(!user) { alert("Please complete registration in settings."); return; }

    const pName = document.getElementById('p-name').value || 'Unnamed Project';

    // Prepare EmailJS Data
    const templateParams = {
        to_name: user.name,
        to_email: user.email,
        project_name: pName,
        system_type: "Member Suite",
        report_link: "https://gold-app-two.vercel.app" // In a real system, you'd upload the PDF to Firebase Storage and pass the download link here
    };

    // Close modal immediately for better UX
    document.getElementById('report-modal').classList.add('hidden');

    // Send the email via EmailJS
    const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // e.g. 'service_xxxxxx'
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // e.g. 'template_xxxxxx'

    if (typeof emailjs !== 'undefined' && emailjs._publicKey && emailjs._publicKey !== "YOUR_EMAILJS_PUBLIC_KEY" && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function(response) {
               console.log('SUCCESS!', response.status, response.text);
               alert(`Report for "${pName}" exported successfully! \nAn email has been sent to ${user.email}.`);
            }, function(error) {
               console.error('FAILED...', error);
               alert(`Report exported to dashboard, but the email failed to send. \nError: ${error.text || 'Unknown error'}`);
            });
    } else {
        // Fallback simulated success if EmailJS is not configured yet
        console.warn("EmailJS is not configured yet. The lead was saved to the Dashboard, but no email was actually sent.");
        alert(`Report for "${pName}" saved to Dashboard! \n\n(Note: Email sending is currently disabled pending EmailJS configuration setup. Check developer instructions.)`);
    }
}

function handleHomeClick() {
    // Check if launched from Hub/Admin (via ?hub=true)
    const urlParams = new URLSearchParams(window.location.search);
    const isHub = urlParams.get('hub') === 'true';

    if (isHub) {
        if(confirm("Return to Admin Hub? Any unsaved data will be lost.")) {
            window.location.href = 'admin.html';
        }
    } else {
        resetForm();
    }
}

function resetForm() {
    if(confirm("Start a new assessment? All current data will be cleared.")) {
        // Clear Inputs
        document.getElementById('p-name').value = '';
        document.getElementById('p-contact').value = '';
        document.getElementById('p-email').value = '';
        document.getElementById('p-phone').value = '';
        document.getElementById('p-photos').value = '';
        document.getElementById('p-photo-count').innerText = 'No photos selected';

        document.getElementById('m-type').selectedIndex = 0;
        document.getElementById('m-jobtype').selectedIndex = -1; // Multi-select clear
        document.getElementById('m-mold-sqft').value = '';
        document.getElementById('m-density').selectedIndex = 0;
        document.getElementById('m-porosity').selectedIndex = 0;
        document.getElementById('m-surface-cond').selectedIndex = 0;
        document.getElementById('m-waste-buffer').selectedIndex = 0;

        document.getElementById('m-cubic').value = '';
        document.getElementById('m-agent').selectedIndex = 0;

        document.getElementById('m-rh').value = '';
        document.getElementById('m-temp').value = '';

        // Costs
        document.getElementById('c-product').value = '';
        document.getElementById('c-techs').value = '';
        document.getElementById('c-hours').value = '';
        document.getElementById('c-rate').value = '';
        document.getElementById('c-misc').value = '';

        // Hide Results
        document.getElementById('m-results').classList.add('hidden');
        document.getElementById('report-modal').classList.add('hidden');

        // Clear early lead tracker
        window.hasGeneratedLeadForThisSession = false;

        // Ensure we navigate back to the Protocol tab
        if(typeof switchTab === 'function') {
            switchTab('quantifier');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Added for context-aware bottom buttons
window.clearProjectData = function() {
    handleHomeClick();
}

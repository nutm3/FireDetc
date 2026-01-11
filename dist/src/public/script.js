const socket = io();

// UI Elements
const consoleA = document.getElementById('console-a');
const consoleB = document.getElementById('console-b');
const winStatus = document.getElementById('win-status');
const profilesContainer = document.getElementById('defender-profiles');
const thirdPartyContainer = document.getElementById('third-party-list');
const checklistContainer = document.getElementById('security-checklist');
const scanBtn = document.getElementById('scan-btn');

// BAB 6: Reference Database (Target Security Products)
const COMMON_DEFENDERS = [
    'Windows Defender', 'Kaspersky', 'Bitdefender', 'Norton', 'McAfee',
    'ESET', 'Avast', 'Sophos', 'Trend Micro', 'Malwarebytes',
    'ZoneAlarm', 'Comodo'
];

let lastScanData = null;

// Socket Logic
socket.on('log-app', (msg) => {
    appendLog(consoleA, msg);
});

socket.on('log-ps', (msg) => {
    appendLog(consoleB, msg);
});

function appendLog(el, msg) {
    const span = document.createElement('div');
    span.textContent = msg;
    el.appendChild(span);
    el.scrollTop = el.scrollHeight;
}

function clearConsole(id) {
    document.getElementById(id).innerHTML = '';
}

function copyConsole(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert('Console log copied!');
    });
}

let wifiIntervalId = null;

// Check Admin and Bridge Status on load
async function init() {
    initChecklist();
    initFirewallProfiles();
    getWifiStatus();

    scanBtn.addEventListener('click', startFullScan);
    document.getElementById('wifi-toggle-btn').addEventListener('click', handleWifiToggle);

    // Speed Test Listeners
    document.getElementById('speed-test-btn').addEventListener('click', runSpeedTest);
    document.getElementById('speed-toggle-visibility').addEventListener('click', toggleSpeedVisibility);

    // WiFi Profiles Listeners
    document.getElementById('wifi-profiles-btn').addEventListener('click', fetchWifiProfiles);
}

async function fetchWifiProfiles() {
    const list = document.getElementById('wifi-profiles-list');
    const btn = document.getElementById('wifi-profiles-btn');

    btn.disabled = true;
    btn.textContent = 'FETCHING...';
    list.innerHTML = '<div class="loading-mini">Scanning Windows Registry...</div>';

    try {
        const response = await fetch('/api/wifi-profiles');
        const profiles = await response.json();

        list.innerHTML = '';
        if (profiles.length === 0) {
            list.innerHTML = '<div class="status-item">No stored profiles found.</div>';
            return;
        }

        profiles.forEach(name => {
            const item = document.createElement('div');
            item.className = 'status-item';
            item.innerHTML = `
                <span class="status-label" style="max-width: 60%; overflow: hidden; text-overflow: ellipsis;">${name}</span>
                <div class="profile-actions">
                    <span class="status-val password-cell grey" id="pass-${name.replace(/\s+/g, '')}" style="margin-right: 15px;">*******</span>
                    <button class="scan-mini-btn" onclick="revealWifiPassword('${name}')">SHOW PASS</button>
                </div>
            `;
            list.appendChild(item);
        });
        appendLog(consoleA, `[WIFI] Found ${profiles.length} stored profiles.`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Failed to fetch WiFi profiles: ${err.message}`);
        list.innerHTML = '<div class="status-item disabled">Bridge Error</div>';
    } finally {
        btn.disabled = false;
        btn.textContent = 'REFRESH PROFILES';
    }
}

async function revealWifiPassword(name) {
    appendLog(consoleA, `[WIFI] Extracting key for: ${name}...`);
    const passCell = document.getElementById(`pass-${name.replace(/\s+/g, '')}`);
    passCell.textContent = '...';

    try {
        const response = await fetch(`/api/wifi-profile-password?name=${encodeURIComponent(name)}`);
        const data = await response.json();

        passCell.textContent = data.password;
        passCell.classList.remove('grey');
        passCell.classList.add('enabled');
        appendLog(consoleA, `[SUCCESS] Password extracted for ${name}. Full details in Console B.`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Extraction failed for ${name}: ${err.message}`);
        passCell.textContent = 'Err';
    }
}

function initFirewallProfiles() {
    const defaults = ['Domain', 'Private', 'Public'];
    profilesContainer.innerHTML = `
        <div class="profile-selection-header">
            <label class="radio-container">
                <input type="radio" name="firewall-select" value="ALL" checked>
                <span class="radio-mark"></span>
                Scan All Profiles
            </label>
        </div>
    `;

    defaults.forEach(name => {
        const item = document.createElement('div');
        item.className = 'status-item';
        item.innerHTML = `
            <div class="list-item-content">
                <label class="radio-container">
                    <input type="radio" name="firewall-select" value="${name}">
                    <span class="radio-mark"></span>
                    <span class="status-label">${name} Profile</span>
                </label>
                <span class="status-val grey">NOT SCANNED</span>
            </div>
            <button class="scan-mini-btn" onclick="scanSingleProfile('${name}')">SCAN</button>
        `;
        profilesContainer.appendChild(item);
    });
}

function handleWifiToggle() {
    const btn = document.getElementById('wifi-toggle-btn');
    const wifiContainer = document.getElementById('wifi-status');
    const wifiIcon = wifiContainer.querySelector('.wifi-icon-wrapper');

    if (wifiIntervalId) {
        // STOP Polling
        clearInterval(wifiIntervalId);
        wifiIntervalId = null;
        btn.textContent = 'LIVE: OFF';
        btn.classList.remove('active');
        wifiIcon.style.animation = 'none';
        appendLog(consoleA, '[WIFI] Auto-monitoring DISABLED.');
    } else {
        // START Polling
        appendLog(consoleA, '[WIFI] Auto-monitoring ENABLED (5s interval).');
        getWifiStatus();
        wifiIntervalId = setInterval(getWifiStatus, 5000);
        btn.textContent = 'LIVE: ON';
        btn.classList.add('active');
        wifiIcon.style.animation = 'wifi-pulse 2s infinite ease-in-out';
    }
}

async function getWifiStatus() {
    const wifiContainer = document.getElementById('wifi-status');
    const wifiName = wifiContainer.querySelector('.wifi-name');

    try {
        const response = await fetch('/api/wifi-status');
        const text = await response.text();

        // Debug logging
        if (text.includes('Cannot GET')) {
            throw new Error('Route not found (404). Please RESTART the server in terminal.');
        }

        const data = JSON.parse(text);

        if (response.ok) {
            if (data.connected) {
                wifiName.textContent = data.ssid || 'Unknown SSID'; // Handle potential empty SSID
                wifiContainer.title = `Signal: ${data.signal}% | Last: ${data.timestamp}`;
                wifiContainer.style.borderColor = 'var(--success)';
            } else {
                wifiName.textContent = 'No Connection';
                wifiContainer.style.borderColor = 'var(--text-secondary)';
                wifiContainer.title = 'WiFi Disconnected';
            }
        } else {
            throw new Error(data.error || 'Server Error');
        }
    } catch (err) {
        console.error('WiFi Fetch Error:', err);
        wifiName.textContent = 'Bridge Err';
        wifiContainer.title = `Error: ${err.message}`;
        wifiContainer.style.borderColor = 'var(--danger)';

        // Detailed log for the user
        if (err.message.includes('RESTART')) {
            appendLog(consoleA, `[WIFI-DETECT] ${err.message}`);
        }
    }
}

// Scan Logic
async function startFullScan() {
    scanBtn.disabled = true;
    scanBtn.textContent = 'SCANNING...';
    appendLog(consoleA, '[SYSTEM] Initiating selective security scan based on checklist...');

    try {
        const response = await fetch('/api/scan-all');
        const data = await response.json();
        lastScanData = data;

        renderProfiles(data.Firewall);
        renderAV(data.AV);
        updateChecklist(data.AV);

        appendLog(consoleA, '[SUCCESS] System scan completed.');
    } catch (err) {
        appendLog(consoleA, `[ERROR] Scan failed: ${err.message}`);
    } finally {
        scanBtn.disabled = false;
        scanBtn.textContent = 'RUN FULL SCAN';
    }
}

async function reportSpeed(val) {
    const dlEl = document.getElementById('download-val');
    dlEl.textContent = `${val} Mbps`;
}

async function runSpeedTest() {
    const btn = document.getElementById('speed-test-btn');
    const dlEl = document.getElementById('download-val');
    const ulEl = document.getElementById('upload-val');

    btn.disabled = true;
    btn.textContent = 'TESTING...';
    dlEl.textContent = 'Measuring...';
    ulEl.textContent = 'Measuring...';

    try {
        const response = await fetch('/api/speed-test');
        const text = await response.text();

        if (text.includes('Cannot GET')) {
            throw new Error('Route not found. Stop & Restart server in terminal (Ctrl+C).');
        }

        const data = JSON.parse(text);

        dlEl.textContent = `${data.download} Mbps`;
        ulEl.textContent = `${data.upload} Mbps`;

        appendLog(consoleA, `[NETWORK] Audit Result: DL ${data.download} Mbps / UL ${data.upload} Mbps`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Speed Audit Failed: ${err.message}`);
        dlEl.textContent = 'Error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'RUN SPEED TEST';
    }
}

function renderProfiles(profiles) {
    profilesContainer.innerHTML = `
        <div class="profile-selection-header">
            <label class="radio-container">
                <input type="radio" name="firewall-select" value="ALL" checked>
                <span class="radio-mark"></span>
                Scan All
            </label>
        </div>
    `;

    if (!profiles || profiles.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'loading-mini';
        msg.textContent = 'Waiting for scan...';
        profilesContainer.appendChild(msg);
        return;
    }

    profiles.forEach(p => {
        const isEnabled = p.Enabled === 1;
        const item = document.createElement('div');
        item.className = 'status-item';
        item.innerHTML = `
            <div class="list-item-content">
                <label class="radio-container">
                    <input type="radio" name="firewall-select" value="${p.Name}">
                    <span class="radio-mark"></span>
                    <span class="status-label">${p.Name} Profile</span>
                </label>
                <span class="status-val ${isEnabled ? 'enabled' : 'disabled'}">
                    ${isEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
            </div>
            <button class="scan-mini-btn" onclick="scanSingleProfile('${p.Name}')">SCAN</button>
        `;
        profilesContainer.appendChild(item);
    });
}

async function scanSingleProfile(name) {
    appendLog(consoleA, `[CHECK] Refreshing Firewall Profile: ${name}...`);
    try {
        const response = await fetch('/api/scan-all');
        const data = await response.json();
        renderProfiles(data.Firewall);
        renderAV(data.AV);
        updateChecklist(data.AV);
        appendLog(consoleA, `[DONE] Firewall ${name} updated.`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Profile scan failed: ${err.message}`);
    }
}

function renderAV(avs) {
    thirdPartyContainer.innerHTML = '';
    // FILTER: Remove Windows Defender from 3rd Party list as it is core OS
    const filtered = (avs || []).filter(av => !av.displayName.toLowerCase().includes('windows defender'));

    if (filtered.length === 0) {
        thirdPartyContainer.innerHTML = '<div class="status-item">No 3rd Party AV Detected</div>';
        return;
    }

    filtered.forEach(av => {
        const stateHex = "0x0" + av.productState.toString(16).toUpperCase();
        const isActive = stateHex.slice(-4, -3) === '1';

        const item = document.createElement('div');
        item.className = 'status-item';
        item.innerHTML = `
            <div class="av-info">
                <span class="status-label">${av.displayName}</span>
                <span class="status-hex">${stateHex}</span>
            </div>
            <span class="status-val ${isActive ? 'enabled' : 'disabled'}">
                ${isActive ? 'ENABLED (ACTIVE)' : 'DISABLED (INACTIVE)'}
            </span>
        `;
        thirdPartyContainer.appendChild(item);
    });
}

// Persistently render all products
function initChecklist() {
    checklistContainer.innerHTML = '';
    COMMON_DEFENDERS.forEach(name => {
        const item = document.createElement('div');
        item.className = 'status-item checklist-item neutral';
        item.id = `checklist-${name.replace(/\s+/g, '-').toLowerCase()}`;
        item.innerHTML = `
            <div class="checklist-header">
                <input type="checkbox" class="checklist-checkbox" checked id="check-${name}">
                <span class="status-label">${name}</span>
            </div>
            <div class="status-footer">
                <span class="status-val grey">NOT SCANNED</span>
                <button class="scan-mini-btn" onclick="scanSingle('${name}')">SCAN</button>
            </div>
        `;
        checklistContainer.appendChild(item);
    });
}

function updateChecklist(detectedAVs) {
    COMMON_DEFENDERS.forEach(name => {
        const isSelected = document.getElementById(`check-${name}`).checked;
        if (!isSelected) return; // Skip if not checked for full scan display

        const item = document.getElementById(`checklist-${name.replace(/\s+/g, '-').toLowerCase()}`);
        const product = (detectedAVs || []).find(av => av.displayName.toLowerCase().includes(name.toLowerCase()));

        let status = 'UNINSTALLED';
        let stateClass = 'neutral';
        let subStatus = '';

        if (product) {
            const stateHex = "0x0" + product.productState.toString(16).toUpperCase();
            const isActive = stateHex.slice(-4, -3) === '1';

            if (isActive) {
                status = 'ENABLED (ACTIVE)';
                stateClass = 'detected';
            } else {
                status = 'DISABLED (INACTIVE)';
                stateClass = 'warning';
                subStatus = `<div class="sub-status">${stateHex}</div>`;
            }
        }

        item.className = `status-item checklist-item ${stateClass}`;
        item.querySelector('.status-val').textContent = status;
        const footer = item.querySelector('.status-footer');
        const oldSub = item.querySelector('.sub-status');
        if (oldSub) oldSub.remove();
        if (subStatus) {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-status';
            subDiv.textContent = subStatus.replace(/<[^>]*>/g, '');
            item.querySelector('.checklist-header').appendChild(subDiv);
        }
    });
}

async function scanSingle(name) {
    appendLog(consoleA, `[CHECK] Individual scan for: ${name}...`);
    try {
        const response = await fetch('/api/scan-all');
        const data = await response.json();

        // SYNC: Update all views with new data
        renderProfiles(data.Firewall);
        renderAV(data.AV);
        updateChecklist(data.AV);

        const product = (data.AV || []).find(av => av.displayName.toLowerCase().includes(name.toLowerCase()));

        // Force update just this one regardless of checkbox
        const item = document.getElementById(`checklist-${name.replace(/\s+/g, '-').toLowerCase()}`);
        let status = 'UNINSTALLED';
        let stateClass = 'neutral';
        if (product) {
            const isActive = ("0x0" + product.productState.toString(16)).slice(-4, -3) === '1';
            status = isActive ? 'ENABLED (ACTIVE)' : 'DISABLED (INACTIVE)';
            stateClass = isActive ? 'detected' : 'warning';
        }
        item.className = `status-item checklist-item ${stateClass}`;
        item.querySelector('.status-val').textContent = status;

        appendLog(consoleA, `[DONE] ${name} check completed.`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Single scan failed: ${err.message}`);
    }
}

async function runSpeedTest() {
    const btn = document.getElementById('speed-test-btn');
    const dlEl = document.getElementById('download-val');
    const ulEl = document.getElementById('upload-val');

    btn.disabled = true;
    btn.textContent = 'TESTING...';
    dlEl.textContent = 'Measuring...';
    ulEl.textContent = 'Measuring...';

    try {
        const response = await fetch('/api/speed-test');
        const text = await response.text();

        if (text.includes('Cannot GET')) {
            throw new Error('Route not found. Stop & Restart server in terminal (Ctrl+C).');
        }

        const data = JSON.parse(text);

        dlEl.textContent = `${data.download} Mbps`;
        ulEl.textContent = `${data.upload} Mbps`;

        // Success: Change color from grey to green (enabled)
        dlEl.classList.remove('grey');
        dlEl.classList.add('enabled');
        ulEl.classList.remove('grey');
        ulEl.classList.add('enabled');

        appendLog(consoleA, `[NETWORK] Speed Test Finished: DL ${data.download} Mbps / UL ${data.upload} Mbps`);
    } catch (err) {
        appendLog(consoleA, `[ERROR] Speed Test Failed: ${err.message}`);
        dlEl.textContent = 'Error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'RUN SPEED TEST';
    }
}

function toggleSpeedVisibility() {
    const resultDiv = document.getElementById('speed-result');
    const btn = document.getElementById('speed-toggle-visibility');
    const isHidden = resultDiv.classList.contains('hidden');

    if (isHidden) {
        resultDiv.classList.remove('hidden');
        btn.textContent = 'HIDE RESULT';
    } else {
        resultDiv.classList.add('hidden');
        btn.textContent = 'SHOW RESULT';
    }
}

init();

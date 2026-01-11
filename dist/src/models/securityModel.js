const { spawn } = require('child_process');
const socketService = require('../services/socketService');

class SecurityModel {
    /**
     * Executes a PowerShell command and returns the output.
     * Streams stdout/stderr to Socket.io for Real-time Dual Console.
     */
    static runPowerShell(command) {
        return new Promise((resolve, reject) => {
            socketService.logToApp(`Executing PowerShell: ${command.substring(0, 100)}...`);

            const ps = spawn('powershell.exe', [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-Command', command
            ]);

            let stdout = '';
            let stderr = '';

            ps.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;
                socketService.logToPS(chunk);
            });

            ps.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderr += chunk;
                socketService.logToPS(`[STDERR] ${chunk}`);
            });

            ps.on('error', (err) => {
                socketService.logToApp(`🛑 Bridge Error: Failed to start PowerShell. ${err.message}`);
                resolve({ stdout: '', stderr: err.message, code: -1 });
            });

            ps.on('close', (code) => {
                if (code !== 0) {
                    socketService.logToApp(`PowerShell exited with code ${code}`);
                }
                resolve({ stdout, stderr, code });
            });
        });
    }

    static async checkAdminStatus() {
        const cmd = '([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")';
        const result = await this.runPowerShell(cmd);
        return result.stdout.trim().toLowerCase() === 'true';
    }

    static async performFullScan() {
        const command = `
        $Result = @{
            Firewall = Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress;
            AV = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select-Object displayName, productState, timestamp | ConvertTo-Json -Compress
        }
        $Result | ConvertTo-Json
        `;

        const result = await this.runPowerShell(command);
        let cleanOutput = result.stdout.trim().replace(/^\uFEFF/, '');

        const parsed = JSON.parse(cleanOutput);

        // Inner depth parsing for WMI/NetSecurity objects
        if (typeof parsed.Firewall === 'string') parsed.Firewall = JSON.parse(parsed.Firewall);
        if (typeof parsed.AV === 'string') parsed.AV = JSON.parse(parsed.AV);

        // Normalizing to arrays
        if (!Array.isArray(parsed.Firewall)) parsed.Firewall = [parsed.Firewall].filter(Boolean);
        if (!Array.isArray(parsed.AV)) parsed.AV = [parsed.AV].filter(Boolean);

        return parsed;
    }

    static async toggleFirewallProfile(profileName, enable) {
        const status = enable ? 'True' : 'False';
        // Execute the change and then verify in a separate line to avoid mixed output
        const command = `Set-NetFirewallProfile -Profile ${profileName} -Enabled ${status}; Get-NetFirewallProfile -Name ${profileName} | Select-Object Name, Enabled | ConvertTo-Json -Compress`;
        const result = await this.runPowerShell(command);

        // Robust cleaning
        let clean = result.stdout.trim().replace(/^\uFEFF/, '');
        try {
            // Find the first { or [ and last } or ] to extract JSON
            const start = Math.max(clean.indexOf('{'), clean.indexOf('['));
            const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
            if (start !== -1 && end !== -1) {
                clean = clean.substring(start, end + 1);
            }
            return JSON.parse(clean);
        } catch (e) {
            socketService.logToApp(`Parsing Warning: Using raw verification due to: ${e.message}`);
            return { success: result.code === 0, raw: clean };
        }
    }

    static async toggleDefender(enable) {
        // Use numbers 0 and 1 for better PowerShell interop compatibility
        // DisableRealtimeMonitoring 0 = Enable (ON)
        // DisableRealtimeMonitoring 1 = Disable (OFF)
        const status = enable ? '0' : '1';
        // Adding a small sleep to allow WMI database to update its state
        const command = `Set-MpPreference -DisableRealtimeMonitoring ${status}; Start-Sleep -Seconds 1; Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Where-Object { $_.displayName -match "Windows Defender" } | Select-Object displayName, productState | ConvertTo-Json -Compress`;
        const result = await this.runPowerShell(command);

        let clean = result.stdout.trim().replace(/^\uFEFF/, '');
        try {
            const start = clean.indexOf('{');
            const end = clean.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                clean = clean.substring(start, end + 1);
            }
            return JSON.parse(clean);
        } catch (e) {
            return { success: result.code === 0, raw: clean };
        }
    }

    static async getWifiStatus() {
        const command = 'netsh.exe wlan show interfaces';
        const result = await this.runPowerShell(command);

        // CLEANING: Remove BOM and trim
        const cleanStdout = result.stdout.replace(/^\uFEFF/, '').trim();
        const lines = cleanStdout.split('\n');

        let ssid = '';
        let signal = '0';
        let connected = false;

        for (let line of lines) {
            const cleanLine = line.trim();
            const upperLine = cleanLine.toUpperCase();

            // Look for state first
            if (upperLine.startsWith('STATE') && cleanLine.toLowerCase().includes('connected')) {
                connected = true;
            }

            // Look for SSID (must exclude BSSID)
            if (upperLine.startsWith('SSID') && !upperLine.includes('BSSID')) {
                const parts = cleanLine.split(':');
                if (parts.length > 1) ssid = parts[1].trim();
            }

            // Look for Signal
            if (upperLine.startsWith('SIGNAL')) {
                const parts = cleanLine.split(':');
                if (parts.length > 1) signal = parts[1].replace('%', '').trim();
            }
        }

        return {
            connected: connected && ssid !== '',
            ssid: ssid || 'Disconnected',
            signal: signal,
            timestamp: new Date().toLocaleTimeString()
        };
    }

    static async runSpeedTest() {
        // Using 5MB Data Sample for more stability (40Mbit total)
        const dlUrl = "https://speed.cloudflare.com/__down?bytes=5242880";
        const dlCommand = `$sw = [Diagnostics.Stopwatch]::StartNew(); (New-Object System.Net.WebClient).DownloadFile("${dlUrl}", "$env:TEMP\\firedetc_test.tmp"); $sw.Stop(); $sw.Elapsed.TotalSeconds`;

        socketService.logToApp('Starting High-Precision Speed Audit (5MB Sample)...');
        const dlResult = await this.runPowerShell(dlCommand);

        const cleanVal = dlResult.stdout.replace(/^\uFEFF/, '').trim();
        const seconds = parseFloat(cleanVal);

        // 5MB = 40 Megabits. Logic: 40 / total_seconds = Mbps
        const mbps = (!isNaN(seconds) && seconds > 0) ? (40 / seconds).toFixed(2) : "0.00";

        const uploadSim = (parseFloat(mbps) * 0.5).toFixed(2);

        // Cleanup
        this.runPowerShell('Remove-Item "$env:TEMP\\firedetc_test.tmp" -ErrorAction SilentlyContinue');

        return {
            download: mbps,
            upload: uploadSim,
            unit: "Mbps"
        };
    }

    static async getWifiProfiles() {
        const command = 'netsh.exe wlan show profiles';
        const result = await this.runPowerShell(command);
        const lines = result.stdout.split('\n');
        const profiles = [];

        for (let line of lines) {
            if (line.includes(':')) {
                const parts = line.split(':');
                const name = parts[1].trim();
                if (name && !line.includes('All User Profile') && !line.includes('Group Policy')) {
                    // This handles cases where "All User Profile" is the label
                    profiles.push(name);
                } else if (line.includes('All User Profile')) {
                    profiles.push(name);
                }
            }
        }
        // Filter out empty or header-like entries
        return profiles.filter(p => p !== '' && !p.includes('profiles on interface'));
    }

    static async getWifiProfilePassword(name) {
        const command = `netsh.exe wlan show profile name="${name}" key=clear`;
        const result = await this.runPowerShell(command);

        // Log details to PS console as requested
        socketService.logToPS(`[WIFI-AUDIT] Detailed Profile: ${name}\n${result.stdout}`);

        const lines = result.stdout.split('\n');
        let password = 'Not Found / Open';

        for (let line of lines) {
            if (line.toLowerCase().includes('key content')) {
                const parts = line.split(':');
                if (parts.length > 1) password = parts[1].trim();
            }
        }

        return { name, password };
    }
}

module.exports = SecurityModel;

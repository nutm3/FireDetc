const SecurityModel = require('../models/securityModel');
const socketService = require('../services/socketService');

exports.checkAdmin = async (req, res) => {
    try {
        const isAdmin = await SecurityModel.checkAdminStatus();
        res.json({ isAdmin });
    } catch (error) {
        socketService.logToApp(`Error in checkAdmin: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

exports.scanAll = async (req, res) => {
    try {
        socketService.logToApp('Initiating full system security scan...');
        const data = await SecurityModel.performFullScan();
        res.json(data);
        socketService.logToApp('Scan completed and data sent to client.');
    } catch (error) {
        socketService.logToApp(`Error in scanAll: ${error.message}`);
        res.status(500).json({
            error: 'Scan failed',
            details: error.message
        });
    }
};

exports.toggleFirewall = async (req, res) => {
    const { profile, enable } = req.body;
    try {
        socketService.logToApp(`Request received: Toggle Firewall [${profile}] to [${enable ? 'ON' : 'OFF'}]`);
        const result = await SecurityModel.toggleFirewallProfile(profile, enable);
        res.json(result);
    } catch (error) {
        socketService.logToApp(`Error toggling firewall: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

exports.toggleDefender = async (req, res) => {
    const { enable } = req.body;
    try {
        socketService.logToApp(`Request received: Toggle Windows Defender to [${enable ? 'ON' : 'OFF'}]`);
        const result = await SecurityModel.toggleDefender(enable);
        res.json(result);
    } catch (error) {
        socketService.logToApp(`Error toggling defender: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

exports.getWifiStatus = async (req, res) => {
    try {
        const result = await SecurityModel.getWifiStatus();
        console.log(`[WIFI_API] Connected: ${result.connected}, SSID: ${result.ssid}`);
        res.json(result);
    } catch (error) {
        console.error(`[WIFI_API_ERROR] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

exports.getSpeedTest = async (req, res) => {
    try {
        const result = await SecurityModel.runSpeedTest();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWifiProfiles = async (req, res) => {
    try {
        const result = await SecurityModel.getWifiProfiles();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWifiProfilePassword = async (req, res) => {
    const { name } = req.query;
    try {
        const result = await SecurityModel.getWifiProfilePassword(name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

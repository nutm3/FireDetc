const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

/**
 * @route   GET /api/check-admin
 * @desc    Checks if the current session has Windows Administrator privileges
 */
router.get('/check-admin', securityController.checkAdmin);

/**
 * @route   GET /api/scan-all
 * @desc    Runs a comprehensive scan of firewall profiles and AV products
 */
router.get('/scan-all', securityController.scanAll);

/**
 * @route   POST /api/toggle-firewall
 * @desc    Enables or Disables a specific Firewall profile
 */
router.post('/toggle-firewall', securityController.toggleFirewall);

/**
 * @route   GET /api/wifi-status
 */
router.get('/wifi-status', securityController.getWifiStatus);

/**
 * @route   GET /api/speed-test
 */
router.get('/speed-test', securityController.getSpeedTest);

/**
 * @route   GET /api/wifi-profiles
 */
router.get('/wifi-profiles', securityController.getWifiProfiles);

/**
 * @route   GET /api/wifi-profile-password
 */
router.get('/wifi-profile-password', securityController.getWifiProfilePassword);

module.exports = router;

# ⚔️ FIREDETC V1.0: Advanced Security Interop Bridge
**Professional WSL-to-Host Security Auditor & Network Intelligence Toolkit**

[![Created by Falatehan Anshor](https://img.shields.io/badge/Created%20By-Falatehan%20Anshor-blue.svg)](https://github.com/nutm3)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Target: Windows/WSL](https://img.shields.io/badge/Platform-WSL2%20%7C%20Windows-lightgrey.svg)]()

---

## 🖥️ Dashboard Overview
![Main UI Preview](imgs/preview-webappUI-firedetc.png)

## 📖 Product Summary
**FIREDETC** is a proprietary security orchestration tool designed for professional Offensive Security practitioners and System Auditors. It facilitates a high-speed data bridge between the **WSL (Windows Subsystem for Linux)** environment and the **Windows Host**, enabling rapid identification of host security posture and network metadata from a unified command interface.

---

## 🚀 Key Capabilities

### 🛡️ 1. Host Security Auditor
Performs automated auditing of Windows security configurations.
- **Firewall Intelligence**: Real-time status reporting for Domain, Private, and Public profiles.
- **Security Product Identification**: Automated detection of active Antivirus and EDR solutions.

| Firewall Profiles | 3rd Party Security | Security Checklist |
|-------------------|--------------------|--------------------|
| ![Windows Defender](imgs/preview-windowsDefenderProfiles.png) | ![3rd Party AV](imgs/preview-3rdPartySecurity.png) | ![Checklist](imgs/preview-SecurityProductChecklist.png) |

### 📡 2. Precision Network Auditing
Integrated tools for high-fidelity network performance and environmental sensing.
- **Speed Audit Engine**: Real-time bandwidth measurement optimized for low-latency assessment.
- **Environmental Sensing**: Live monitoring of Wi-Fi metrics including SSID identification and signal strength analytics.

![Network Speed](imgs/preview-networkSpeed.png)

### 🔐 3. Wireless Credential Auditor
Advanced utility for managing and verifying wireless network security metadata.
- **Registry Reconnaissance**: Automated enumeration of all stored wireless profiles.
- **Credential Verification**: Direct extraction of secure network keys for audit verification.

![WiFi Profiles](imgs/preview-storedWifiProfiles.png)

---

## 📺 Operational Monitoring
FireDetc features a high-density operational dashboard for real-time telemetry.

![Console Logs](imgs/preview-webappConsole-firedetc.png)

- **App Telemetry**: Tracks application-level operations and API transaction logs.
- **System Bridge Feed**: Raw telemetry from the underlying Windows/WSL interop layer.

---

## 📥 Deployment Guide

### System Requirements
- **OS**: Windows 10/11 with WSL2 Subsystem.
- **Prerequisites**: Node.js environment configured within WSL.
- **Access Level**: Host-level Administrator privileges required for Bridge initialization.

### Execution
The deployment is managed through the unified `build.sh` orchestration script.

1. **Initialization**:
   ```bash
   cd FireDetc/dist
   chmod +x build.sh
   ./build.sh
   ```

2. **Management Options**:
   - **Install**: Bootstrap required dependencies.
   - **Run (Production)**: Launch the optimized audit server.
   - **Run (Dev)**: Monitor real-time codebase modifications.
   - **Clean**: Sanitize the local environment.

| Initialization | Production Execution | Development Execution |
|----------------|----------------------|-----------------------|
| ![Setup First](imgs/preview-setupFirst-firedetc.png) | ![Prod Mode](imgs/preview-setupStartProduction-firedetc.png) | ![Dev Mode](imgs/preview-setupStartDevelopment-firedetc.png) |

3. **Interface Access**:
   Access the tactical dashboard at: `http://localhost:9115`

---

## 👨‍💻 Author
**Falatehan Anshor**
- [GitHub Profile](https://github.com/nutm3)
- [Project Repository](https://github.com/nutm3/FireDetc)

---

## ⚖️ Legal Disclaimer
*FireDetc is intended strictly for authorized security auditing and professional assessment purposes. Unauthorized use against targets without explicit consent is strictly prohibited and illegal. The author assumes no liability for misuse.*

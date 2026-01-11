const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Load Environment Variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const socketService = require('./services/socketService');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io via Service
socketService.init(server);

const PORT = process.env.PORT || 9115;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Load MVC Routes
app.use('/api', apiRoutes);

// Debug Route
app.get('/debug-ping', (req, res) => res.send('FireDetc-Bridge-v1.0.2-Active'));

// Strict Admin Check on Startup (Requirement BAB 6)
const startServer = async () => {
    try {
        const SecurityModel = require('./models/securityModel');
        const isAdmin = await SecurityModel.checkAdminStatus();

        if (isAdmin) {
            console.log('✅ Admin Status Verified');
        } else {
            console.warn('\n' + '='.repeat(50));
            console.warn('⚠️ WARNING: BRIDGE RESTRICTED');
            console.warn('FireDetc is running but Bridge is Restricted (Not Administrator).');
            console.warn('Full Audit features will be disabled.');
            console.warn('='.repeat(50) + '\n');
        }

        server.listen(PORT, '0.0.0.0', () => {
            socketService.logToApp(`FireDetc Server (MVC Ready) started on http://localhost:${PORT}`);
            socketService.logToApp('WSL Interop Bridge: INITIALIZED (ADMIN MODE)');
        });
    } catch (err) {
        console.error('Failed to initialize Bridge:', err.message);
        process.exit(1);
    }
};

startServer();

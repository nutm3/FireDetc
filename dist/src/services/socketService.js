let io;

module.exports = {
    init: (server) => {
        const { Server } = require('socket.io');
        io = new Server(server);

        io.on('connection', (socket) => {
            console.log('[FireDetc] Client connected to Socket Service');
        });

        return io;
    },

    logToApp: (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = `[${timestamp}] [WSL/LOG] ${msg}`;
        console.log(formatted);
        if (io) io.emit('log-app', formatted);
    },

    logToPS: (msg) => {
        if (io) io.emit('log-ps', msg);
    },

    getIO: () => io
};

import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { authenticateSocket } from './socket.auth.js';
import { handleConnection } from './handlers/connection.handler.js';
export const createSocketServer = (server) => {
    const io = new Server(server, { cors: { origin: env.CORS_ORIGIN } });
    io.use(authenticateSocket);
    io.on('connection', handleConnection);
    return io;
};

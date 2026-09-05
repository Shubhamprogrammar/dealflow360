import { verifyAccessToken } from '../utils/jwt.js';
export const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token)
            throw new Error('missing token');
        socket.data.user = verifyAccessToken(token);
        next();
    }
    catch {
        next(new Error('UNAUTHENTICATED'));
    }
};

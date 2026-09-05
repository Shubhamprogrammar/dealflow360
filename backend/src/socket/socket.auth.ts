import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
export const authenticateSocket = (socket: Socket, next: (error?: Error) => void): void => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) throw new Error('missing token');
    socket.data.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error('UNAUTHENTICATED'));
  }
};

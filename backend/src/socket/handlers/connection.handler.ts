import type { Socket } from 'socket.io';
export const handleConnection = (socket: Socket): void => {
  socket.on('disconnect', () => undefined);
};

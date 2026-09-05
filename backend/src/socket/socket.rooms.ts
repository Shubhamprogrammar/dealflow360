import type { Socket } from 'socket.io';
export const joinRoom = async (socket: Socket, room: string): Promise<void> => {
  await socket.join(room);
};
export const leaveRoom = async (socket: Socket, room: string): Promise<void> => {
  await socket.leave(room);
};

export const joinRoom = async (socket, room) => {
    await socket.join(room);
};
export const leaveRoom = async (socket, room) => {
    await socket.leave(room);
};

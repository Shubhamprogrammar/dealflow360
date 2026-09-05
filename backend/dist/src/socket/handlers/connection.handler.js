export const handleConnection = (socket) => {
    socket.on('disconnect', () => undefined);
};

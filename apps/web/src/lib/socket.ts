import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        socket = io(url, {
            auth: {
                token: getToken(),
            },
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (url: string): Socket => {
  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });
  }
  return socket;
};

export const disposeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

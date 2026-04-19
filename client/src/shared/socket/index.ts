"use client";

export { getSocket } from "./socket";
export { SocketProvider } from "./socketProvider";
export type { SocketContextValue } from "./socketProvider";
export { SocketContext } from "./socketProvider";
export { useSocket } from "./useSocket";
export { useSocketEmit } from "./useSocketEmit";
export { useSocketEvent } from "./useSocketEvent";
export { useQueueStack } from "./useQueueStack";
export {
  eServerToClientEvents,
  eClientToServerEvents,
} from "./socket.type";
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  iSocketProvider,
} from "./socket.type";

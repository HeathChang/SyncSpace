"use client";

export { getSocket, disposeSocket } from "./socket";
export { SocketProvider } from "./socketProvider";
export type { SocketContextValue } from "./socketProvider";
export { SocketContext } from "./socketProvider";
export { useSocket, useSocketByNamespace } from "./useSocket";
export { useSocketEmit } from "./useSocketEmit";
export { useSocketEmitAck } from "./useSocketEmitAck";
export { useSocketEvent } from "./useSocketEvent";
export { useSocketReconnect } from "./useSocketReconnect";
export { useThrottledEmit } from "./useThrottledEmit";
export { useDebouncedEmit } from "./useDebouncedEmit";
export { useQueueStack } from "./useQueueStack";
export { createRequestId } from "./request-id";
export { eNamespace } from "./namespaces";
export type { Namespace } from "./namespaces";
export {
  eServerToClientEvents,
  eClientToServerEvents,
} from "./socket.type";
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  iSocketProvider,
} from "./socket.type";
export { eErrorCode } from "./socket.envelope";
export type {
  EventAck,
  EventError,
  RequestEnvelope,
  AckCallback,
} from "./socket.envelope";

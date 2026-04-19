import type { ConnectionState } from "../model/connection";

export const initialConnectionState: ConnectionState = {
    isConnected: false,
    transport: "websocket",
    reconnectAttempts: 0,
    latencyMs: 0,
    lastConnectedAt: "연결 전",
  };
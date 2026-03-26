export interface ConnectionState {
  isConnected: boolean;
  transport: "websocket" | "polling";
  reconnectAttempts: number;
  latencyMs: number;
  lastConnectedAt: string;
}

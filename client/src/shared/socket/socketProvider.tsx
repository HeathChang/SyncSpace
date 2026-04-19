"use client";

import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSocket } from "./socket";
import type { Socket } from "socket.io-client";
import type { ConnectionState } from "@/shared/model";
import { initialConnectionState } from "@/shared/const";
import type { iSocketProvider } from "./socket.type";

export type SocketContextValue = {
  socket: Socket;
  connection: ConnectionState;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider = ({
  children,
  url,
}: iSocketProvider) => {
  const [socket] = useState<Socket>(() => getSocket(url));
  const [connection, setConnection] = useState<ConnectionState>(
    initialConnectionState
  );

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      setConnection({
        ...initialConnectionState,
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
      });
    };

    const handleDisconnect = () => {
      setConnection((prev) => ({
        ...prev,
        isConnected: false,
      }));
    };

    const handleError = () => {
      setConnection((prev) => ({
        ...prev,
        isConnected: false,
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    socket.on("reconnect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off("reconnect", handleConnect);
      socket.disconnect();
    };
  }, [socket]);

  const value = useMemo(
    () => ({ socket, connection }),
    [socket, connection]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
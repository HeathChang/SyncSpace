"use client";

import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSocket } from "./socket";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";
import type { Socket } from "socket.io-client";
import type { ConnectionState } from "@/shared/model";
import { initialConnectionState } from "@/shared/const";
import type { iSocketProvider } from "./socket.type";

export interface SocketContextValue {
  socket: Socket;             // main namespace (인증/presence/notification)
  boardSocket: Socket;        // /board namespace
  chatSocket: Socket;         // /chat namespace
  connection: ConnectionState;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

const namespacesToConnect: Namespace[] = [eNamespace.main, eNamespace.board, eNamespace.chat];

export const SocketProvider = ({
  children,
  url,
}: iSocketProvider) => {
  const [sockets] = useState<Record<Namespace, Socket>>(() => ({
    [eNamespace.main]: getSocket(url, eNamespace.main),
    [eNamespace.board]: getSocket(url, eNamespace.board),
    [eNamespace.chat]: getSocket(url, eNamespace.chat),
  }));
  const [connection, setConnection] = useState<ConnectionState>(initialConnectionState);

  useEffect(() => {
    const mainSocket = sockets[eNamespace.main];

    const handleConnect = () => {
      setConnection({
        ...initialConnectionState,
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
      });
    };

    const handleDisconnect = () => {
      setConnection((prev) => ({ ...prev, isConnected: false }));
    };

    const handleError = () => {
      setConnection((prev) => ({ ...prev, isConnected: false }));
    };

    // 모든 namespace 연결 시도
    for (const ns of namespacesToConnect) {
      sockets[ns].connect();
    }

    mainSocket.on("connect", handleConnect);
    mainSocket.on("disconnect", handleDisconnect);
    mainSocket.on("connect_error", handleError);
    mainSocket.on("reconnect", handleConnect);

    return () => {
      mainSocket.off("connect", handleConnect);
      mainSocket.off("disconnect", handleDisconnect);
      mainSocket.off("connect_error", handleError);
      mainSocket.off("reconnect", handleConnect);
      for (const ns of namespacesToConnect) {
        sockets[ns].disconnect();
      }
    };
  }, [sockets]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: sockets[eNamespace.main],
      boardSocket: sockets[eNamespace.board],
      chatSocket: sockets[eNamespace.chat],
      connection,
    }),
    [sockets, connection],
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

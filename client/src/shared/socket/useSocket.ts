"use client";

import { useContext } from "react";
import { SocketContext } from "./socketProvider";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";
import type { Socket } from "socket.io-client";

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("SocketProvider가 필요합니다.");
    }
    return {
        socket: context.socket,
        connection: context.connection,
    };
};

export const useSocketByNamespace = (namespace: Namespace = eNamespace.main): Socket => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("SocketProvider가 필요합니다.");
    }
    if (namespace === eNamespace.board) return context.boardSocket;
    if (namespace === eNamespace.chat) return context.chatSocket;
    return context.socket;
};

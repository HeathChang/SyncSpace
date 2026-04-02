// src/shared/socket/useSocket.ts
import { useContext } from "react";
import { SocketContext } from "@/shared/socket/socketProvider";

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("SocketProvider가 필요합니다.");
    }

    return {
        socket: context.socket,
        connection: context.connection
    }
};
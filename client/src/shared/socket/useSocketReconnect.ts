"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";

/**
 * 소켓이 재연결되면 onReconnect 콜백을 호출한다.
 * - 메시지 히스토리/Room 재조인 등 재연결 복구 로직을 배치한다.
 */
export const useSocketReconnect = (onReconnect: () => void) => {
    const { socket } = useSocket();

    useEffect(() => {
        socket.on("reconnect", onReconnect);

        return () => {
            socket.off("reconnect", onReconnect);
        };
    }, [socket, onReconnect]);
};

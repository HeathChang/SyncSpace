"use client";

import { useCallback } from "react";
import { useSocket } from "./useSocket";
import { createRequestId } from "./request-id";

/**
 * 단방향 emit — ACK 응답이 필요 없는 이벤트용 (예: cursor:move).
 * requestId를 자동으로 포함한다.
 */
export const useSocketEmit = () => {
    const { socket } = useSocket();

    const emit = useCallback(
        (event: string, payload: Record<string, unknown>) => {
            socket.emit(event, { ...payload, requestId: createRequestId() });
        },
        [socket],
    );

    return { emit };
};

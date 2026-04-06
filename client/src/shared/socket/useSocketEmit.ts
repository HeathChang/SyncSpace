import { useCallback } from "react";
import { useSocket } from "./useSocket";

export const useSocketEmit = () => {
    const { socket } = useSocket();

    const emit = useCallback(
        (event: string, payload: unknown) => {
            socket.emit(event, payload);
        },
        [socket],
    );

    return { emit };
};
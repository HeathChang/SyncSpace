import { useEffect } from "react";
import { useSocket } from "./useSocket";

interface iUseSocketEvent {
    event: string;
    handler: (data: unknown) => void;
}

export const useSocketEvent = ({ event, handler }: iUseSocketEvent) => {
    const { socket } = useSocket();

    useEffect(() => {
        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
        };
    }, [event, handler, socket]);
};
import { useSocket } from "./useSocket";

export const useSocketEmit = () => {
    const { socket } = useSocket();

    const emit = (event: string, payload: unknown) => {
        socket.emit(event, payload);
    };

    return { emit };
};
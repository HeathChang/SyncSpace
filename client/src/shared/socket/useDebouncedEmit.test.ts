import { act, renderHook } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { useDebouncedEmit } from "./useDebouncedEmit";
import { SocketContext } from "./socketProvider";
import type { Socket } from "socket.io-client";

const createMockSocket = () => {
    const calls: Array<[string, unknown]> = [];
    const socket = {
        emit: (event: string, payload: unknown) => {
            calls.push([event, payload]);
        },
    } as unknown as Socket;
    return { socket, calls };
};

const createWrapper = (socket: Socket): React.FC<PropsWithChildren> =>
    ({ children }) =>
        React.createElement(
            SocketContext.Provider,
            {
                value: {
                    socket,
                    boardSocket: socket,
                    chatSocket: socket,
                    connection: {
                        isConnected: true,
                        transport: "websocket",
                        reconnectAttempts: 0,
                        latencyMs: 0,
                        lastConnectedAt: "",
                    },
                },
            },
            children,
        );

describe("useDebouncedEmit", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should not emit until delayMs has passed", () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useDebouncedEmit({ delayMs: 200 }), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            result.current.emit("ev", { v: 1 });
        });

        expect(calls.length).toBe(0);

        act(() => {
            jest.advanceTimersByTime(199);
        });
        expect(calls.length).toBe(0);

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(calls.length).toBe(1);
    });

    it("should reset timer on subsequent calls and emit only the last value", () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useDebouncedEmit({ delayMs: 100 }), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            result.current.emit("ev", { v: 1 });
        });
        act(() => {
            jest.advanceTimersByTime(50);
            result.current.emit("ev", { v: 2 });
        });
        act(() => {
            jest.advanceTimersByTime(50);
            result.current.emit("ev", { v: 3 });
        });
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(calls.length).toBe(1);
        expect((calls[0][1] as { v: number }).v).toBe(3);
    });
});

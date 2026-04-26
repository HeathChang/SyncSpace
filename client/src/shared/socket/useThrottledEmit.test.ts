import { act, renderHook } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { useThrottledEmit } from "./useThrottledEmit";
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

describe("useThrottledEmit", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should emit immediately on first call (leading edge)", () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useThrottledEmit({ intervalMs: 100 }), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            result.current.emit("cursor:move", { x: 1, y: 1 });
        });

        expect(calls.length).toBe(1);
        expect(calls[0][0]).toBe("cursor:move");
    });

    it("should batch rapid calls into a single trailing emit", () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useThrottledEmit({ intervalMs: 100 }), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            result.current.emit("cursor:move", { x: 1 });
            result.current.emit("cursor:move", { x: 2 });
            result.current.emit("cursor:move", { x: 3 });
        });

        expect(calls.length).toBe(1);

        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(calls.length).toBe(2);
        expect((calls[1][1] as { x: number }).x).toBe(3); // 최신 값
    });

    it("should attach requestId to every emitted payload", () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useThrottledEmit({ intervalMs: 50 }), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            result.current.emit("ev", { foo: "bar" });
        });

        const payload = calls[0][1] as Record<string, unknown>;
        expect(payload.foo).toBe("bar");
        expect(typeof payload.requestId).toBe("string");
    });
});

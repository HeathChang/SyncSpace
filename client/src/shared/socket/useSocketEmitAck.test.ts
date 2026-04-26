import { act, renderHook } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { useSocketEmitAck } from "./useSocketEmitAck";
import { SocketContext } from "./socketProvider";
import { eErrorCode } from "./socket.envelope";
import type { Socket } from "socket.io-client";

type EmittedCall = [string, unknown, (ack: unknown) => void];

const createMockSocket = () => {
    const calls: EmittedCall[] = [];
    const socket = {
        emit: (event: string, payload: unknown, ack: (ack: unknown) => void) => {
            calls.push([event, payload, ack]);
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

describe("useSocketEmitAck", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should include an auto-generated requestId in the payload", async () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useSocketEmitAck(), {
            wrapper: createWrapper(socket),
        });

        act(() => {
            void result.current.emitAck("test:event", { foo: "bar" });
        });

        expect(calls.length).toBe(1);
        const [eventName, payload] = calls[0];
        expect(eventName).toBe("test:event");
        expect(payload).toMatchObject({ foo: "bar" });
        expect((payload as { requestId: string }).requestId).toBeTruthy();
    });

    it("should resolve with the ACK response when server replies", async () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useSocketEmitAck(), {
            wrapper: createWrapper(socket),
        });

        let resolved: unknown;
        await act(async () => {
            const promise = result.current.emitAck("test:event", {});
            const [, , ackFn] = calls[0];
            ackFn({ ok: true, data: { value: 42 } });
            resolved = await promise;
        });

        expect(resolved).toEqual({ ok: true, data: { value: 42 } });
    });

    it("should resolve with INTERNAL_ERROR on timeout", async () => {
        const { socket } = createMockSocket();
        const { result } = renderHook(() => useSocketEmitAck({ timeoutMs: 100 }), {
            wrapper: createWrapper(socket),
        });

        let resolved: unknown;
        await act(async () => {
            const promise = result.current.emitAck("test:event", {});
            jest.advanceTimersByTime(101);
            resolved = await promise;
        });

        expect(resolved).toMatchObject({
            ok: false,
            error: { code: eErrorCode.INTERNAL_ERROR },
        });
    });

    it("should not resolve twice if ACK arrives after timeout", async () => {
        const { socket, calls } = createMockSocket();
        const { result } = renderHook(() => useSocketEmitAck({ timeoutMs: 100 }), {
            wrapper: createWrapper(socket),
        });

        await act(async () => {
            const promise = result.current.emitAck("test:event", {});
            jest.advanceTimersByTime(101);
            const resolved = await promise;
            expect(resolved).toMatchObject({ ok: false });

            const [, , ackFn] = calls[0];
            // Late ACK should be ignored — no throw, no second resolve
            expect(() => ackFn({ ok: true, data: null })).not.toThrow();
        });
    });
});

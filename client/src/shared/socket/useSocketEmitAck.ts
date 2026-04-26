"use client";

import { useCallback } from "react";
import { useSocketByNamespace } from "./useSocket";
import { createRequestId } from "./request-id";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";
import type { EventAck } from "./socket.envelope";
import { eErrorCode } from "./socket.envelope";

interface UseSocketEmitAckOptions {
    timeoutMs?: number;
    namespace?: Namespace;
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * ACK 기반 emit — 요청 성공/실패를 Promise로 수신.
 * - namespace 지정 시 해당 namespace 소켓 사용 (기본: main).
 * - 자동으로 requestId 생성 + payload 포함.
 * - timeoutMs 초과 시 INTERNAL_ERROR 응답.
 */
export const useSocketEmitAck = ({
    timeoutMs = DEFAULT_TIMEOUT_MS,
    namespace = eNamespace.main,
}: UseSocketEmitAckOptions = {}) => {
    const socket = useSocketByNamespace(namespace);

    const emitAck = useCallback(
        <TData = unknown>(
            event: string,
            payload: Record<string, unknown>,
        ): Promise<EventAck<TData>> => {
            return new Promise((resolve) => {
                const requestId = createRequestId();
                const envelope = { ...payload, requestId };

                let settled = false;
                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    resolve({
                        ok: false,
                        error: {
                            code: eErrorCode.INTERNAL_ERROR,
                            message: `ack timeout after ${timeoutMs}ms`,
                        },
                    });
                }, timeoutMs);

                socket.emit(event, envelope, (ack: EventAck<TData>) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve(ack);
                });
            });
        },
        [socket, timeoutMs],
    );

    return { emitAck };
};

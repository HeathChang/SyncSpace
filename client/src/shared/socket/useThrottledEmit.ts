"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSocketByNamespace } from "./useSocket";
import { createRequestId } from "./request-id";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";

interface UseThrottledEmitOptions {
    intervalMs?: number;
    namespace?: Namespace;
}

/**
 * 고빈도 이벤트(cursor:move 등)용 throttle emit.
 * - leading edge 즉시 전송 + intervalMs 단위로 최신 값 1회 전송.
 * - ACK 없는 fire-and-forget. requestId는 자동 포함.
 */
export const useThrottledEmit = ({
    intervalMs = 50,
    namespace = eNamespace.main,
}: UseThrottledEmitOptions = {}) => {
    const socket = useSocketByNamespace(namespace);
    const lastEmitAtRef = useRef(0);
    const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPayloadRef = useRef<{ event: string; payload: Record<string, unknown> } | null>(
        null,
    );

    useEffect(() => {
        return () => {
            if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
            pendingPayloadRef.current = null;
        };
    }, []);

    const emit = useCallback(
        (event: string, payload: Record<string, unknown>) => {
            const now = Date.now();
            const elapsed = now - lastEmitAtRef.current;

            if (elapsed >= intervalMs) {
                socket.emit(event, { ...payload, requestId: createRequestId() });
                lastEmitAtRef.current = now;
                pendingPayloadRef.current = null;
                return;
            }

            // Throttle 구간 — 최신 payload를 보관, 단일 트레일링 emit 예약
            pendingPayloadRef.current = { event, payload };
            if (pendingTimerRef.current) return;

            const remaining = intervalMs - elapsed;
            pendingTimerRef.current = setTimeout(() => {
                pendingTimerRef.current = null;
                const queued = pendingPayloadRef.current;
                pendingPayloadRef.current = null;
                if (!queued) return;

                socket.emit(queued.event, {
                    ...queued.payload,
                    requestId: createRequestId(),
                });
                lastEmitAtRef.current = Date.now();
            }, remaining);
        },
        [intervalMs, socket],
    );

    return { emit };
};

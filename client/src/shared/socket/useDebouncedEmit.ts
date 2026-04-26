"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSocketByNamespace } from "./useSocket";
import { createRequestId } from "./request-id";
import { eNamespace } from "./namespaces";
import type { Namespace } from "./namespaces";

interface UseDebouncedEmitOptions {
    delayMs?: number;
    namespace?: Namespace;
}

/**
 * 입력 종료 후 일정 시간 뒤에 emit (검색어 자동완성 등).
 * - 마지막 호출 후 delayMs 동안 추가 호출이 없으면 전송.
 * - ACK 없는 fire-and-forget.
 */
export const useDebouncedEmit = ({
    delayMs = 300,
    namespace = eNamespace.main,
}: UseDebouncedEmitOptions = {}) => {
    const socket = useSocketByNamespace(namespace);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<{ event: string; payload: Record<string, unknown> } | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            pendingRef.current = null;
        };
    }, []);

    const emit = useCallback(
        (event: string, payload: Record<string, unknown>) => {
            pendingRef.current = { event, payload };
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                const queued = pendingRef.current;
                pendingRef.current = null;
                if (!queued) return;

                socket.emit(queued.event, {
                    ...queued.payload,
                    requestId: createRequestId(),
                });
            }, delayMs);
        },
        [delayMs, socket],
    );

    return { emit };
};

import type { z } from "zod";
import type { AckCallback, RequestEnvelope } from "../socket.envelope";
import { eErrorCode } from "../socket.envelope";
import type { IDedupStore } from "../storage/dedup-interface";
import { formatZodError } from "../schemas/event-schemas";

/**
 * 모든 핸들러 진입점에서 사용:
 * - requestId 존재 검증
 * - dedup store 조회/등록
 * - Zod 페이로드 검증
 * 통과 시 검증된 페이로드 반환, 실패 시 ack 호출 후 null.
 */
export const validateAndDedup = async <TSchema extends z.ZodTypeAny, TAckData>(
    socketId: string,
    rawPayload: unknown,
    schema: TSchema,
    ack: AckCallback<TAckData>,
    dedupStore: IDedupStore,
): Promise<z.infer<TSchema> | null> => {
    if (!rawPayload || typeof rawPayload !== "object") {
        ack({
            ok: false,
            error: { code: eErrorCode.INVALID_INPUT, message: "payload is required" },
        });
        return null;
    }

    const payload = rawPayload as RequestEnvelope<unknown>;
    if (!payload.requestId || typeof payload.requestId !== "string") {
        ack({
            ok: false,
            error: { code: eErrorCode.INVALID_INPUT, message: "requestId is required" },
        });
        return null;
    }

    const dup = await dedupStore.isDuplicate(socketId, payload.requestId);
    if (dup) {
        ack({
            ok: false,
            error: {
                code: eErrorCode.DUPLICATE_REQUEST,
                message: "duplicate request",
            },
        });
        return null;
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
        ack({
            ok: false,
            error: {
                code: eErrorCode.INVALID_INPUT,
                message: formatZodError(parsed.error),
            },
        });
        return null;
    }

    await dedupStore.register(socketId, payload.requestId);
    return parsed.data;
};

export const consumeRate = <TAckData>(
    rateLimiter: { consume(socketId: string, event: string): boolean },
    socketId: string,
    event: string,
    ack: AckCallback<TAckData>,
): boolean => {
    if (rateLimiter.consume(socketId, event)) return true;
    ack({
        ok: false,
        error: { code: eErrorCode.INTERNAL_ERROR, message: "rate limit exceeded" },
    });
    return false;
};

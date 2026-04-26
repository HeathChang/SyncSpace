import type { Socket } from "socket.io";
import { logger } from "../logger";

/**
 * Socket 이벤트 자동 로깅 + 에러 추적 미들웨어.
 * - 모든 인바운드 이벤트의 처리 시간/결과를 기록.
 * - ACK 콜백 호출을 후크하여 ok/error 분류.
 */

const HIGH_FREQ_EVENTS = new Set<string>(["cursor:move"]);

export const installEventLogger = (socket: Socket): void => {
    socket.use(([event, ...args], next) => {
        // 고빈도 이벤트는 debug 레벨로만 (요청량이 폭증)
        if (HIGH_FREQ_EVENTS.has(event)) {
            next();
            return;
        }

        const startedAt = Date.now();
        const ackIndex = args.length - 1;
        const possibleAck = args[ackIndex];

        if (typeof possibleAck === "function") {
            const originalAck = possibleAck as (response: unknown) => void;
            args[ackIndex] = ((response: unknown) => {
                const elapsedMs = Date.now() - startedAt;
                const ok =
                    typeof response === "object" &&
                    response !== null &&
                    (response as { ok?: unknown }).ok === true;
                logger.info(
                    {
                        socketId: socket.id,
                        userId: socket.data.userId,
                        event,
                        ok,
                        elapsedMs,
                    },
                    "socket event handled",
                );
                originalAck(response);
            }) as typeof originalAck;
        } else {
            logger.info(
                {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    event,
                    fireAndForget: true,
                },
                "socket event received",
            );
        }

        next();
    });

    socket.on("error", (error: Error) => {
        logger.error(
            {
                socketId: socket.id,
                userId: socket.data.userId,
                err: { message: error.message, stack: error.stack },
            },
            "socket error",
        );
    });
};

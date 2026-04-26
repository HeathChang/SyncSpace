import type { Namespace } from "socket.io";
import { randomUUID } from "crypto";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { AckCallback, RequestEnvelope } from "../socket.envelope";
import { eErrorCode } from "../socket.envelope";
import { DedupStore } from "../dedup-store";
import { RateLimiter } from "../rate-limiter";
import { logger } from "../logger";

interface InstallChatOptions {
    nsp: Namespace<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: DedupStore;
    rateLimiter: RateLimiter;
}

export const installChatHandlers = ({
    nsp,
    dedupStore,
    rateLimiter,
}: InstallChatOptions): void => {
    nsp.on("connection", (socket) => {
        const authenticatedUserId = socket.data.userId as string;
        logger.info(
            { socketId: socket.id, userId: authenticatedUserId, ns: "/chat" },
            "chat namespace connected",
        );

        const checkDedup = <TPayload, TAckData>(
            payload: RequestEnvelope<TPayload>,
            ack: AckCallback<TAckData>,
        ): boolean => {
            if (!payload?.requestId) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "requestId is required" },
                });
                return false;
            }
            if (dedupStore.isDuplicate(socket.id, payload.requestId)) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.DUPLICATE_REQUEST, message: "duplicate request" },
                });
                return false;
            }
            dedupStore.register(socket.id, payload.requestId);
            return true;
        };

        socket.on(eClientToServerEvents.ROOM_JOIN, (payload, ack) => {
            if (!checkDedup(payload, ack)) return;
            const { roomId } = payload;
            if (!roomId) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.ROOM_REQUIRED, message: "roomId is required" },
                });
                return;
            }
            socket.join(roomId);
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.ROOM_LEAVE, (payload, ack) => {
            if (!checkDedup(payload, ack)) return;
            const { roomId } = payload;
            if (!roomId) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.ROOM_REQUIRED, message: "roomId is required" },
                });
                return;
            }
            socket.leave(roomId);
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.MESSAGE_SEND, (payload, ack) => {
            if (!rateLimiter.consume(socket.id, eClientToServerEvents.MESSAGE_SEND)) {
                ack({
                    ok: false,
                    error: {
                        code: eErrorCode.INTERNAL_ERROR,
                        message: "rate limit exceeded",
                    },
                });
                return;
            }
            if (!checkDedup(payload, ack)) return;

            const { roomId, message } = payload;
            const userId = authenticatedUserId;
            const trimmedMessage = message?.trim() ?? "";

            if (!roomId || !trimmedMessage) {
                ack({
                    ok: false,
                    error: {
                        code: eErrorCode.INVALID_INPUT,
                        message: "roomId and message are required",
                    },
                });
                return;
            }

            const timestamp = new Date().toISOString();
            const messageId = randomUUID();

            nsp.to(roomId).emit(eServerToClientEvents.MESSAGE_NEW, {
                roomId,
                userId,
                message: trimmedMessage,
                timestamp,
            });

            ack({ ok: true, data: { messageId, timestamp } });
        });

        socket.on("disconnect", () => {
            dedupStore.remove(socket.id);
            rateLimiter.removeSocket(socket.id);
        });
    });
};

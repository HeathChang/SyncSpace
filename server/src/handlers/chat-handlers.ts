import type { Namespace } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { IDedupStore } from "../storage/dedup-interface";
import { RateLimiter } from "../rate-limiter";
import { logger } from "../logger";
import { validateAndDedup, consumeRate } from "./handler-utils";
import { messageSendSchema, roomReqSchema } from "../schemas/event-schemas";
import { z } from "zod";
import { createMessage } from "../repositories/message-repository";

const requestIdField = z.object({ requestId: z.string().min(1) });

const roomReqEnvelope = roomReqSchema.merge(requestIdField);
const messageSendEnvelope = messageSendSchema.merge(requestIdField);

interface InstallChatOptions {
    nsp: Namespace<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: IDedupStore;
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

        socket.on(eClientToServerEvents.ROOM_JOIN, async (rawPayload, ack) => {
            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                roomReqEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;
            socket.join(validated.roomId);
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.ROOM_LEAVE, async (rawPayload, ack) => {
            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                roomReqEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;
            socket.leave(validated.roomId);
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.MESSAGE_SEND, async (rawPayload, ack) => {
            if (!consumeRate(rateLimiter, socket.id, eClientToServerEvents.MESSAGE_SEND, ack)) return;

            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                messageSendEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

            const userId = authenticatedUserId;
            const persisted = await createMessage({
                roomId: validated.roomId,
                userId,
                content: validated.message,
            });

            nsp.to(validated.roomId).emit(eServerToClientEvents.MESSAGE_NEW, {
                roomId: validated.roomId,
                userId,
                message: persisted.content,
                timestamp: persisted.createdAt.toISOString(),
            });

            ack({
                ok: true,
                data: {
                    messageId: persisted.id,
                    timestamp: persisted.createdAt.toISOString(),
                },
            });
        });

        socket.on("disconnect", async () => {
            await dedupStore.remove(socket.id);
            rateLimiter.removeSocket(socket.id);
        });
    });
};

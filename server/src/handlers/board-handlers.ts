import type { Namespace, Server } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { IDedupStore } from "../storage/dedup-interface";
import { RateLimiter } from "../rate-limiter";
import { NotificationStore } from "../notification/notification-store";
import { eErrorCode } from "../socket.envelope";
import { logger } from "../logger";
import { validateAndDedup, consumeRate } from "./handler-utils";
import {
    boardCreateSchema,
    boardMoveSchema,
    boardDeleteSchema,
    cursorMoveSchema,
    roomReqSchema,
} from "../schemas/event-schemas";
import { z } from "zod";
import {
    createCard,
    moveCard,
    deleteCard,
} from "../repositories/board-repository";

const requestIdField = z.object({ requestId: z.string().min(1) });

const roomReqEnvelope = roomReqSchema.merge(requestIdField);
const boardCreateEnvelope = boardCreateSchema.merge(requestIdField);
const boardMoveEnvelope = boardMoveSchema.merge(requestIdField);
const boardDeleteEnvelope = boardDeleteSchema.merge(requestIdField);
const cursorMoveEnvelope = cursorMoveSchema.merge(requestIdField);

interface InstallBoardOptions {
    nsp: Namespace<ClientToServerEvents, ServerToClientEvents>;
    mainIo: Server<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: IDedupStore;
    rateLimiter: RateLimiter;
    notificationStore: NotificationStore;
    userRoom: (userId: string) => string;
}

export const installBoardHandlers = ({
    nsp,
    mainIo,
    dedupStore,
    rateLimiter,
    notificationStore,
    userRoom,
}: InstallBoardOptions): void => {
    nsp.on("connection", (socket) => {
        const authenticatedUserId = socket.data.userId as string;
        logger.info(
            { socketId: socket.id, userId: authenticatedUserId, ns: "/board" },
            "board namespace connected",
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

        socket.on(eClientToServerEvents.BOARD_CREATE, async (rawPayload, ack) => {
            if (!consumeRate(rateLimiter, socket.id, eClientToServerEvents.BOARD_CREATE, ack)) return;

            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                boardCreateEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

            const { roomId, cardId, title, assigneeId, tags } = validated;
            const actorId = authenticatedUserId;

            const created = await createCard({
                id: cardId,
                roomId,
                title,
                assigneeId,
                tags: tags.length > 0 ? tags : ["신규"],
            });

            nsp.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId,
                action: "create",
                card: {
                    id: created.id,
                    title: created.title,
                    assigneeId: created.assigneeId,
                    column: created.column,
                    updatedAt: created.updatedAt.toISOString(),
                    tags: created.tags,
                },
            });

            if (assigneeId !== actorId) {
                const actorName = (socket.data.userName as string | undefined) ?? actorId;
                const notification = await notificationStore.create({
                    userId: assigneeId,
                    kind: "board:assigned",
                    title: "새 작업이 할당되었습니다",
                    body: `${actorName}님이 "${title}" 카드를 할당했습니다.`,
                    meta: { roomId, cardId },
                });
                mainIo.to(userRoom(assigneeId)).emit(
                    eServerToClientEvents.NOTIFICATION_NEW,
                    notification,
                );
            }

            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.BOARD_MOVE, async (rawPayload, ack) => {
            if (!consumeRate(rateLimiter, socket.id, eClientToServerEvents.BOARD_MOVE, ack)) return;

            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                boardMoveEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

            const moved = await moveCard(validated.cardId, validated.toColumn);
            if (!moved) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "card not found" },
                });
                return;
            }

            nsp.to(validated.roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId: validated.roomId,
                action: "move",
                cardId: validated.cardId,
                toColumn: validated.toColumn,
                updatedAt: moved.updatedAt.toISOString(),
            });
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.BOARD_DELETE, async (rawPayload, ack) => {
            if (!consumeRate(rateLimiter, socket.id, eClientToServerEvents.BOARD_DELETE, ack)) return;

            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                boardDeleteEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

            await deleteCard(validated.cardId);

            nsp.to(validated.roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId: validated.roomId,
                action: "delete",
                cardId: validated.cardId,
            });
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.CURSOR_MOVE, (rawPayload) => {
            if (!rateLimiter.consume(socket.id, eClientToServerEvents.CURSOR_MOVE)) return;
            const parsed = cursorMoveEnvelope.safeParse(rawPayload);
            if (!parsed.success) return;
            void parsed.data;
        });

        socket.on("disconnect", async () => {
            await dedupStore.remove(socket.id);
            rateLimiter.removeSocket(socket.id);
        });
    });
};

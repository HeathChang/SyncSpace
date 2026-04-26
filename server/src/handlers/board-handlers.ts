import type { Namespace, Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { AckCallback, RequestEnvelope } from "../socket.envelope";
import { eErrorCode } from "../socket.envelope";
import { DedupStore } from "../dedup-store";
import { RateLimiter } from "../rate-limiter";
import { NotificationStore } from "../notification/notification-store";
import { logger } from "../logger";

const BOARD_COLUMNS = new Set(["todo", "inProgress", "done"]);

interface InstallBoardOptions {
    nsp: Namespace<ClientToServerEvents, ServerToClientEvents>;
    mainIo: Server<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: DedupStore;
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

        const checkRate = <TAckData>(event: string, ack: AckCallback<TAckData>): boolean => {
            if (rateLimiter.consume(socket.id, event)) return true;
            ack({
                ok: false,
                error: {
                    code: eErrorCode.INTERNAL_ERROR,
                    message: "rate limit exceeded",
                },
            });
            return false;
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

        socket.on(eClientToServerEvents.BOARD_CREATE, (payload, ack) => {
            if (!checkRate(eClientToServerEvents.BOARD_CREATE, ack)) return;
            if (!checkDedup(payload, ack)) return;

            const { roomId, cardId, title, assigneeId, tags } = payload;
            const trimmedTitle = title?.trim() ?? "";
            const actorId = authenticatedUserId;

            if (!roomId || !cardId || !assigneeId || !trimmedTitle) {
                ack({
                    ok: false,
                    error: {
                        code: eErrorCode.INVALID_INPUT,
                        message: "roomId, cardId, assigneeId, title are required",
                    },
                });
                return;
            }

            nsp.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId,
                action: "create",
                card: {
                    id: cardId,
                    title: trimmedTitle,
                    assigneeId,
                    column: "todo",
                    updatedAt: "방금 전",
                    tags: tags.length > 0 ? tags : ["신규"],
                },
            });

            if (assigneeId !== actorId) {
                const actorName = (socket.data.userName as string | undefined) ?? actorId;
                const notification = notificationStore.create({
                    userId: assigneeId,
                    kind: "board:assigned",
                    title: "새 작업이 할당되었습니다",
                    body: `${actorName}님이 "${trimmedTitle}" 카드를 할당했습니다.`,
                    meta: { roomId, cardId },
                });
                // 알림은 메인 namespace의 개인 room으로 전송
                mainIo.to(userRoom(assigneeId)).emit(
                    eServerToClientEvents.NOTIFICATION_NEW,
                    notification,
                );
            }

            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.BOARD_MOVE, (payload, ack) => {
            if (!checkRate(eClientToServerEvents.BOARD_MOVE, ack)) return;
            if (!checkDedup(payload, ack)) return;

            const { roomId, cardId, toColumn } = payload;
            if (!roomId || !cardId || !BOARD_COLUMNS.has(toColumn)) {
                ack({
                    ok: false,
                    error: {
                        code: eErrorCode.INVALID_INPUT,
                        message: "roomId, cardId, toColumn are required",
                    },
                });
                return;
            }

            nsp.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId,
                action: "move",
                cardId,
                toColumn,
                updatedAt: "방금 전",
            });
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.BOARD_DELETE, (payload, ack) => {
            if (!checkRate(eClientToServerEvents.BOARD_DELETE, ack)) return;
            if (!checkDedup(payload, ack)) return;

            const { roomId, cardId } = payload;
            if (!roomId || !cardId) {
                ack({
                    ok: false,
                    error: {
                        code: eErrorCode.INVALID_INPUT,
                        message: "roomId and cardId are required",
                    },
                });
                return;
            }

            nsp.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
                roomId,
                action: "delete",
                cardId,
            });
            ack({ ok: true, data: undefined });
        });

        socket.on(eClientToServerEvents.CURSOR_MOVE, (payload) => {
            if (!rateLimiter.consume(socket.id, eClientToServerEvents.CURSOR_MOVE)) return;
            // cursor:move는 ACK 없는 fire-and-forget (고빈도)
            // dedup도 비용 대비 가치가 낮아 생략
            void payload;
        });

        socket.on("disconnect", () => {
            dedupStore.remove(socket.id);
            rateLimiter.removeSocket(socket.id);
        });
    });
};

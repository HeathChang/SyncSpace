import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import { eClientToServerEvents, eServerToClientEvents } from "./socket.types";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket.types";
import type { AckCallback, RequestEnvelope } from "./socket.envelope";
import { eErrorCode } from "./socket.envelope";
import { DedupStore } from "./dedup-store";
import { logger } from "./logger";
import "dotenv/config";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const PORT = Number(process.env.PORT) || 8001;
const DEDUP_TTL_MS = 30_000;
const DEDUP_MAX_PER_SOCKET = 256;

const app = express();
app.use(cors({ origin: [CORS_ORIGIN], credentials: true }));

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: [CORS_ORIGIN],
        credentials: true,
    },
});

const userToSocketIds = new Map<string, Set<string>>();
const socketToUserId = new Map<string, string>();
const dedupStore = new DedupStore({
    ttlMs: DEDUP_TTL_MS,
    maxPerSocket: DEDUP_MAX_PER_SOCKET,
});

const addUserSocket = (userId: string, socketId: string) => {
    const socketIds = userToSocketIds.get(userId) ?? new Set<string>();
    const wasOnline = socketIds.size > 0;

    socketIds.add(socketId);
    userToSocketIds.set(userId, socketIds);
    socketToUserId.set(socketId, userId);

    return { wasOnline };
};

const removeUserSocket = (socketId: string) => {
    const userId = socketToUserId.get(socketId);
    if (!userId) {
        return { userId: undefined, isNowOffline: false };
    }

    socketToUserId.delete(socketId);
    const socketIds = userToSocketIds.get(userId);
    if (!socketIds) {
        return { userId, isNowOffline: false };
    }

    socketIds.delete(socketId);
    if (socketIds.size > 0) {
        return { userId, isNowOffline: false };
    }

    userToSocketIds.delete(userId);
    return { userId, isNowOffline: true };
};

const getOnlineUserIds = () => [...userToSocketIds.keys()];
const boardColumns = new Set(["todo", "inProgress", "done"]);

const checkDedup = <TPayload, TAckData>(
    socketId: string,
    payload: RequestEnvelope<TPayload>,
    ack: AckCallback<TAckData>,
): boolean => {
    if (!payload?.requestId) {
        ack({
            ok: false,
            error: {
                code: eErrorCode.INVALID_INPUT,
                message: "requestId is required",
            },
        });
        return false;
    }

    if (dedupStore.isDuplicate(socketId, payload.requestId)) {
        ack({
            ok: false,
            error: {
                code: eErrorCode.DUPLICATE_REQUEST,
                message: "duplicate request",
            },
        });
        return false;
    }

    dedupStore.register(socketId, payload.requestId);
    return true;
};

io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "a user connected");

    socket.on(eClientToServerEvents.USER_JOIN, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { userId } = payload;
        if (!userId) {
            ack({
                ok: false,
                error: {
                    code: eErrorCode.INVALID_INPUT,
                    message: "userId is required",
                },
            });
            return;
        }

        const previousUserId = socketToUserId.get(socket.id);
        if (previousUserId && previousUserId !== userId) {
            const previousUser = removeUserSocket(socket.id);
            if (previousUser.userId && previousUser.isNowOffline) {
                socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                    userId: previousUser.userId,
                });
            }
        }

        const { wasOnline } = addUserSocket(userId, socket.id);
        socket.data.userId = userId;

        if (!wasOnline) {
            socket.broadcast.emit(eServerToClientEvents.USER_ONLINE, { userId });
        }

        const onlineUserIds = getOnlineUserIds();
        socket.emit(eServerToClientEvents.PRESENCE_SNAPSHOT, {
            userIds: onlineUserIds,
        });
        logger.info({ userId, socketId: socket.id }, "user joined");

        ack({ ok: true, data: { userIds: onlineUserIds } });
    });

    socket.on(eClientToServerEvents.ROOM_JOIN, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { roomId } = payload;
        if (!roomId) {
            ack({
                ok: false,
                error: { code: eErrorCode.ROOM_REQUIRED, message: "roomId is required" },
            });
            return;
        }

        socket.join(roomId);
        logger.info({ socketId: socket.id, roomId }, "socket joined room");
        ack({ ok: true, data: undefined });
    });

    socket.on(eClientToServerEvents.ROOM_LEAVE, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { roomId } = payload;
        if (!roomId) {
            ack({
                ok: false,
                error: { code: eErrorCode.ROOM_REQUIRED, message: "roomId is required" },
            });
            return;
        }

        socket.leave(roomId);
        logger.info({ socketId: socket.id, roomId }, "socket left room");
        ack({ ok: true, data: undefined });
    });

    socket.on(eClientToServerEvents.MESSAGE_SEND, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { roomId, message } = payload;
        const userId = socket.data.userId as string | undefined;
        const trimmedMessage = message?.trim() ?? "";

        if (!userId) {
            ack({
                ok: false,
                error: { code: eErrorCode.UNAUTHORIZED, message: "user not joined" },
            });
            return;
        }
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

        io.to(roomId).emit(eServerToClientEvents.MESSAGE_NEW, {
            roomId,
            userId,
            message: trimmedMessage,
            timestamp,
        });

        ack({ ok: true, data: { messageId, timestamp } });
    });

    socket.on(eClientToServerEvents.BOARD_CREATE, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { roomId, cardId, title, assigneeId, tags } = payload;
        const trimmedTitle = title?.trim() ?? "";

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

        io.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
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

        ack({ ok: true, data: undefined });
    });

    socket.on(eClientToServerEvents.BOARD_MOVE, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

        const { roomId, cardId, toColumn } = payload;
        if (!roomId || !cardId || !boardColumns.has(toColumn)) {
            ack({
                ok: false,
                error: {
                    code: eErrorCode.INVALID_INPUT,
                    message: "roomId, cardId, toColumn are required",
                },
            });
            return;
        }

        io.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
            roomId,
            action: "move",
            cardId,
            toColumn,
            updatedAt: "방금 전",
        });

        ack({ ok: true, data: undefined });
    });

    socket.on(eClientToServerEvents.BOARD_DELETE, (payload, ack) => {
        if (!checkDedup(socket.id, payload, ack)) return;

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

        io.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
            roomId,
            action: "delete",
            cardId,
        });

        ack({ ok: true, data: undefined });
    });

    socket.on("disconnect", () => {
        const userId = socket.data.userId as string | undefined;
        const removed = removeUserSocket(socket.id);
        dedupStore.remove(socket.id);
        logger.info({ userId, socketId: socket.id }, "user disconnected");

        if (removed.userId && removed.isNowOffline) {
            socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                userId: removed.userId,
            });
        }
    });
});

server.listen(PORT, () => {
    logger.info(`socket server listening on :${PORT}`);
});

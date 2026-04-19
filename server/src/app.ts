import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "./socket.types";
import { ClientToServerEvents, ServerToClientEvents } from "./socket.types";
import { logger } from "./logger";
import "dotenv/config";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const PORT = Number(process.env.PORT) || 8001;

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

io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "a user connected");

    socket.on(eClientToServerEvents.USER_JOIN, ({ userId }) => {
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

        socket.emit(eServerToClientEvents.PRESENCE_SNAPSHOT, {
            userIds: getOnlineUserIds(),
        });
        logger.info({ userId, socketId: socket.id }, "user joined");
    });

    socket.on(eClientToServerEvents.ROOM_JOIN, ({ roomId }) => {
        if (!roomId) {
            return;
        }

        socket.join(roomId);
        logger.info({ socketId: socket.id, roomId }, "socket joined room");
    });

    socket.on(eClientToServerEvents.ROOM_LEAVE, ({ roomId }) => {
        if (!roomId) {
            return;
        }

        socket.leave(roomId);
        logger.info({ socketId: socket.id, roomId }, "socket left room");
    });

    socket.on(eClientToServerEvents.MESSAGE_SEND, ({ roomId, message }) => {
        const userId = socket.data.userId as string | undefined;
        const trimmedMessage = message.trim();

        if (!roomId || !userId || !trimmedMessage) {
            return;
        }

        io.to(roomId).emit(eServerToClientEvents.MESSAGE_NEW, {
            roomId,
            userId,
            message: trimmedMessage,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on(
        eClientToServerEvents.BOARD_CREATE,
        ({ roomId, cardId, title, assigneeId, tags }) => {
            const trimmedTitle = title.trim();

            if (!roomId || !cardId || !assigneeId || !trimmedTitle) {
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
        },
    );

    socket.on(eClientToServerEvents.BOARD_MOVE, ({ roomId, cardId, toColumn }) => {
        if (!roomId || !cardId || !boardColumns.has(toColumn)) {
            return;
        }

        io.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
            roomId,
            action: "move",
            cardId,
            toColumn,
            updatedAt: "방금 전",
        });
    });

    socket.on(eClientToServerEvents.BOARD_DELETE, ({ roomId, cardId }) => {
        if (!roomId || !cardId) {
            return;
        }

        io.to(roomId).emit(eServerToClientEvents.BOARD_UPDATED, {
            roomId,
            action: "delete",
            cardId,
        });
    });

    socket.on("disconnect", () => {
        const userId = socket.data.userId as string | undefined;
        const removed = removeUserSocket(socket.id);
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



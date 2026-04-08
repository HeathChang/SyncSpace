import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "./socket.types";
import { ClientToServerEvents, ServerToClientEvents } from "./socket.types";

const app = express();
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: ["http://localhost:3000"],
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

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

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
        console.log(`user ${userId} joined (socketId: ${socket.id})`);
    });

    socket.on(eClientToServerEvents.ROOM_JOIN, ({ roomId }) => {
        if (!roomId) {
            return;
        }

        socket.join(roomId);
        console.log(`socket ${socket.id} joined room ${roomId}`);
    });

    socket.on(eClientToServerEvents.ROOM_LEAVE, ({ roomId }) => {
        if (!roomId) {
            return;
        }

        socket.leave(roomId);
        console.log(`socket ${socket.id} left room ${roomId}`);
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

    socket.on("disconnect", () => {
        const userId = socket.data.userId as string | undefined;
        const removed = removeUserSocket(socket.id);
        console.log(`user ${userId} disconnected (socketId: ${socket.id})`);

        if (removed.userId && removed.isNowOffline) {
            socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                userId: removed.userId,
            });
        }
    });
});

server.listen(8001, () => {
    console.log("socket server listening on :8001");
});







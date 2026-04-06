import cors from "cors";
import express from "express";
import http from "http";
import { Server, type Socket } from "socket.io";
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

io.on("connection", (socket: Socket) => {
    console.log("a user connected", socket.id);

    socket.on(eClientToServerEvents.USER_JOIN, ({ userId }) => {
        socket.data.userId = userId;
        socket.broadcast.emit(eServerToClientEvents.USER_ONLINE, { userId });
        console.log(`user ${userId} joined (socketId: ${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
        const userId = socket.data.userId as string | undefined;
        console.log(`user ${userId} disconnected (socketId: ${socket.id})`);

        if (userId) {
            socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, { userId });
        }
    });
});

server.listen(8001, () => {
    console.log("socket server listening on :8001");
});







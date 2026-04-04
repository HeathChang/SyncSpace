import cors from "cors";
import express from "express";
import http from "http";
import { Server, type Socket } from "socket.io";

interface ClientToServerEvents {
    "user:join": { userId: string };
}

interface ServerToClientEvents {
    "user:online": { userId: string };
    "user:offline": { userId: string };
}

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

    socket.on("user:join", ({ userId }) => {
        socket.data.userId = userId;
        socket.broadcast.emit("user:online", { userId });
        console.log(`user joined: ${userId} (${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
        const userId = socket.data.userId as string | undefined;
        console.log("a user disconnected", socket.id, reason);

        if (userId) {
            socket.broadcast.emit("user:offline", { userId });
        }
    });
});

server.listen(8001, () => {
    console.log("socket server listening on :8001");
});







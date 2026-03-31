import cors from "cors";
import express from "express";
import http from "http";
import { Server, type Socket } from "socket.io";

const app = express();
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        credentials: true,
    },
});

io.on("connection", (socket: Socket) => {
    console.log("a user connected", socket.id);
});

server.listen(8001, () => {
    console.log("socket server listening on :8001");
});







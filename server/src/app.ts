import cors from "cors";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket.types";
import { DedupStore } from "./dedup-store";
import { RateLimiter } from "./rate-limiter";
import { authRouter } from "./auth/auth-routes";
import { socketAuthMiddleware } from "./auth/socket-auth";
import { NotificationStore } from "./notification/notification-store";
import { eNamespace } from "./namespaces";
import { installMainHandlers } from "./handlers/main-handlers";
import { installBoardHandlers } from "./handlers/board-handlers";
import { installChatHandlers } from "./handlers/chat-handlers";
import { applyRedisAdapter } from "./scaling/redis-adapter";
import { httpLogger } from "./observability/http-logger";
import { installEventLogger } from "./observability/event-logger";
import { logger } from "./logger";
import "dotenv/config";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const PORT = Number(process.env.PORT) || 8001;
const DEDUP_TTL_MS = 30_000;
const DEDUP_MAX_PER_SOCKET = 256;

const app = express();
app.use(cors({ origin: [CORS_ORIGIN], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(httpLogger);
app.use("/auth", authRouter);

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: [CORS_ORIGIN],
        credentials: true,
    },
});

const dedupStore = new DedupStore({
    ttlMs: DEDUP_TTL_MS,
    maxPerSocket: DEDUP_MAX_PER_SOCKET,
});
const generalLimiter = new RateLimiter({ capacity: 30, refillTokensPerSecond: 10 });
const notificationStore = new NotificationStore();
const userRoom = (userId: string): string => `user:${userId}`;

// 모든 namespace에 인증 미들웨어 적용
io.use(socketAuthMiddleware);
const boardNsp = io.of(eNamespace.board);
const chatNsp = io.of(eNamespace.chat);
boardNsp.use(socketAuthMiddleware);
chatNsp.use(socketAuthMiddleware);

// 이벤트 자동 로거를 모든 namespace에 설치
io.on("connection", installEventLogger);
boardNsp.on("connection", installEventLogger);
chatNsp.on("connection", installEventLogger);

// 핸들러 설치
installMainHandlers({ io, dedupStore, notificationStore, userRoom });
installBoardHandlers({
    nsp: boardNsp,
    mainIo: io,
    dedupStore,
    rateLimiter: generalLimiter,
    notificationStore,
    userRoom,
});
installChatHandlers({
    nsp: chatNsp,
    dedupStore,
    rateLimiter: generalLimiter,
});

const start = async () => {
    await applyRedisAdapter(io);
    server.listen(PORT, () => {
        logger.info(`socket server listening on :${PORT}`);
    });
};

void start();

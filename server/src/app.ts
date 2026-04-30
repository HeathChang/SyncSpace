import cors from "cors";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import Redis from "ioredis";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket.types";
import { DedupStore } from "./dedup-store";
import { RedisDedupStore } from "./storage/redis-dedup-store";
import type { IDedupStore } from "./storage/dedup-interface";
import { RateLimiter } from "./rate-limiter";
import { authRouter } from "./auth/auth-routes";
import { apiRouter } from "./routes/api-routes";
import { socketAuthMiddleware } from "./auth/socket-auth";
import { NotificationStore } from "./notification/notification-store";
import { eNamespace } from "./namespaces";
import { installMainHandlers } from "./handlers/main-handlers";
import { installBoardHandlers } from "./handlers/board-handlers";
import { installChatHandlers } from "./handlers/chat-handlers";
import { applyRedisAdapter } from "./scaling/redis-adapter";
import { httpLogger } from "./observability/http-logger";
import { installEventLogger } from "./observability/event-logger";
import { prisma } from "./db/prisma";
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
app.use("/api", apiRouter);

// 헬스체크
app.get("/health", (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});
app.get("/ready", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true });
    } catch (error) {
        res.status(503).json({ ok: false, error: "db not ready" });
    }
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: [CORS_ORIGIN], credentials: true },
});

const generalLimiter = new RateLimiter({ capacity: 30, refillTokensPerSecond: 10 });
const notificationStore = new NotificationStore();
const userRoom = (userId: string): string => `user:${userId}`;

const buildDedupStore = (): IDedupStore => {
    const url = process.env.REDIS_URL;
    if (!url) {
        return new DedupStore({
            ttlMs: DEDUP_TTL_MS,
            maxPerSocket: DEDUP_MAX_PER_SOCKET,
        });
    }
    const redis = new Redis(url);
    logger.info({ url }, "RedisDedupStore enabled");
    return new RedisDedupStore(redis, DEDUP_TTL_MS);
};

const dedupStore = buildDedupStore();

io.use(socketAuthMiddleware);
const boardNsp = io.of(eNamespace.board);
const chatNsp = io.of(eNamespace.chat);
boardNsp.use(socketAuthMiddleware);
chatNsp.use(socketAuthMiddleware);

io.on("connection", installEventLogger);
boardNsp.on("connection", installEventLogger);
chatNsp.on("connection", installEventLogger);

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

const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutdown initiated");
    server.close(() => {
        logger.info("http server closed");
    });
    io.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

void start();

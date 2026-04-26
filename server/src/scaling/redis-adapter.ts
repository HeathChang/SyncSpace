import type { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { logger } from "../logger";

/**
 * Multi-instance 확장을 위한 Redis adapter 적용.
 * - REDIS_URL 환경변수가 있을 때만 활성화 (없으면 single-process 메모리 어댑터).
 * - Pub/Sub 기반으로 모든 인스턴스가 동일한 room/event를 공유.
 */
export const applyRedisAdapter = async (io: Server): Promise<boolean> => {
    const url = process.env.REDIS_URL;
    if (!url) {
        logger.info("REDIS_URL not set — using in-memory adapter (single instance only)");
        return false;
    }

    try {
        const pubClient = new Redis(url, { lazyConnect: true });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        io.adapter(createAdapter(pubClient, subClient));
        logger.info({ url }, "Redis adapter applied");
        return true;
    } catch (error) {
        logger.error(
            { err: error instanceof Error ? error.message : String(error) },
            "Failed to apply Redis adapter — falling back to in-memory",
        );
        return false;
    }
};

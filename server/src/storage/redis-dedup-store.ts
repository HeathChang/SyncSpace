import type Redis from "ioredis";
import type { IDedupStore } from "./dedup-interface";

/**
 * Redis 기반 분산 dedup store.
 * - 키: dedup:{socketId}:{requestId}, 값: 1, TTL: ttlMs/1000초
 * - 모든 인스턴스가 같은 Redis 인스턴스를 바라보므로 멀티 프로세스에서 일관됨.
 * - 소켓 disconnect 시 cleanup은 Redis 키 패턴 SCAN으로 수행.
 */
export class RedisDedupStore implements IDedupStore {
    private readonly redis: Redis;
    private readonly ttlSec: number;

    constructor(redis: Redis, ttlMs: number) {
        this.redis = redis;
        this.ttlSec = Math.max(1, Math.floor(ttlMs / 1000));
    }

    private key(socketId: string, requestId: string): string {
        return `syncspace:dedup:${socketId}:${requestId}`;
    }

    async isDuplicate(socketId: string, requestId: string): Promise<boolean> {
        const exists = await this.redis.exists(this.key(socketId, requestId));
        return exists === 1;
    }

    async register(socketId: string, requestId: string): Promise<void> {
        await this.redis.set(this.key(socketId, requestId), "1", "EX", this.ttlSec);
    }

    async remove(socketId: string): Promise<void> {
        const pattern = `syncspace:dedup:${socketId}:*`;
        const stream = this.redis.scanStream({ match: pattern, count: 100 });
        const pipeline = this.redis.pipeline();

        await new Promise<void>((resolve, reject) => {
            stream.on("data", (keys: string[]) => {
                for (const key of keys) {
                    pipeline.del(key);
                }
            });
            stream.on("end", () => {
                pipeline
                    .exec()
                    .then(() => resolve())
                    .catch(reject);
            });
            stream.on("error", reject);
        });
    }
}

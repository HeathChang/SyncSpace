/**
 * Token bucket 기반 per-socket per-event rate limiter.
 * - cursor:move 같은 고빈도 이벤트의 폭주를 방지.
 * - 각 (socketId, event) 조합마다 독립된 버킷.
 */

interface RateLimiterOptions {
    capacity: number;          // 버킷 최대 토큰 수
    refillTokensPerSecond: number;  // 초당 토큰 충전 속도
}

interface Bucket {
    tokens: number;
    lastRefillAt: number;
}

export class RateLimiter {
    private readonly buckets = new Map<string, Bucket>();
    private readonly capacity: number;
    private readonly refillRate: number;

    constructor({ capacity, refillTokensPerSecond }: RateLimiterOptions) {
        this.capacity = capacity;
        this.refillRate = refillTokensPerSecond;
    }

    consume(socketId: string, event: string): boolean {
        const key = `${socketId}::${event}`;
        const now = Date.now();
        const bucket = this.buckets.get(key) ?? {
            tokens: this.capacity,
            lastRefillAt: now,
        };

        const elapsedSec = (now - bucket.lastRefillAt) / 1000;
        const refilled = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillRate);
        bucket.tokens = refilled;
        bucket.lastRefillAt = now;

        if (bucket.tokens < 1) {
            this.buckets.set(key, bucket);
            return false;
        }

        bucket.tokens -= 1;
        this.buckets.set(key, bucket);
        return true;
    }

    removeSocket(socketId: string): void {
        for (const key of this.buckets.keys()) {
            if (key.startsWith(`${socketId}::`)) {
                this.buckets.delete(key);
            }
        }
    }
}

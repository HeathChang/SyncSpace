/**
 * requestId 기반 중복 요청 방지 저장소 (in-memory).
 * - 소켓별로 최근 N개의 requestId를 보관.
 * - TTL이 지난 requestId는 자동으로 만료.
 * - 멀티 인스턴스에서는 storage/redis-dedup-store 사용.
 */

import type { IDedupStore } from "./storage/dedup-interface";

interface DedupEntry {
    requestIds: Set<string>;
    timestamps: Map<string, number>;
}

interface DedupStoreOptions {
    ttlMs: number;
    maxPerSocket: number;
}

export class DedupStore implements IDedupStore {
    private readonly store = new Map<string, DedupEntry>();
    private readonly ttlMs: number;
    private readonly maxPerSocket: number;

    constructor({ ttlMs, maxPerSocket }: DedupStoreOptions) {
        this.ttlMs = ttlMs;
        this.maxPerSocket = maxPerSocket;
    }

    isDuplicate(socketId: string, requestId: string): boolean {
        const entry = this.store.get(socketId);
        if (!entry) {
            return false;
        }

        this.evictExpired(entry);
        return entry.requestIds.has(requestId);
    }

    register(socketId: string, requestId: string): void {
        const entry = this.store.get(socketId) ?? {
            requestIds: new Set<string>(),
            timestamps: new Map<string, number>(),
        };

        entry.requestIds.add(requestId);
        entry.timestamps.set(requestId, Date.now());

        if (entry.requestIds.size > this.maxPerSocket) {
            this.evictOldest(entry);
        }

        this.store.set(socketId, entry);
    }

    remove(socketId: string): void {
        this.store.delete(socketId);
    }

    private evictExpired(entry: DedupEntry): void {
        const now = Date.now();
        for (const [requestId, timestamp] of entry.timestamps) {
            if (now - timestamp > this.ttlMs) {
                entry.requestIds.delete(requestId);
                entry.timestamps.delete(requestId);
            }
        }
    }

    private evictOldest(entry: DedupEntry): void {
        const entries = [...entry.timestamps.entries()];
        entries.sort(([, a], [, b]) => a - b);

        const excessCount = entry.requestIds.size - this.maxPerSocket;
        for (let index = 0; index < excessCount; index += 1) {
            const [requestId] = entries[index];
            entry.requestIds.delete(requestId);
            entry.timestamps.delete(requestId);
        }
    }
}

import { Readable } from "stream";
import type Redis from "ioredis";
import { RedisDedupStore } from "./redis-dedup-store";

const createMockRedis = () => {
    const store = new Map<string, string>();

    const mock = {
        async exists(key: string): Promise<number> {
            return store.has(key) ? 1 : 0;
        },
        async set(key: string, value: string, _mode: string, _ttlSec: number): Promise<"OK"> {
            store.set(key, value);
            return "OK";
        },
        scanStream({ match }: { match: string; count?: number }) {
            const prefix = match.replace(/\*$/, "");
            const matched = [...store.keys()].filter((key) => key.startsWith(prefix));
            return Readable.from([matched]);
        },
        pipeline() {
            const ops: Array<() => void> = [];
            const pipeline = {
                del: (key: string) => {
                    ops.push(() => store.delete(key));
                    return pipeline;
                },
                async exec() {
                    ops.forEach((op) => op());
                    return [] as unknown[];
                },
            };
            return pipeline;
        },
        _store: store,
    };

    return mock as unknown as Redis & { _store: Map<string, string> };
};

describe("RedisDedupStore", () => {
    it("should return false when requestId is not registered", async () => {
        const redis = createMockRedis();
        const store = new RedisDedupStore(redis, 30_000);
        expect(await store.isDuplicate("s1", "req-1")).toBe(false);
    });

    it("should return true after registering the same requestId", async () => {
        const redis = createMockRedis();
        const store = new RedisDedupStore(redis, 30_000);
        await store.register("s1", "req-1");
        expect(await store.isDuplicate("s1", "req-1")).toBe(true);
    });

    it("should isolate keys per socket", async () => {
        const redis = createMockRedis();
        const store = new RedisDedupStore(redis, 30_000);
        await store.register("s1", "req-1");
        expect(await store.isDuplicate("s2", "req-1")).toBe(false);
    });

    it("should remove all entries for a socket on disconnect", async () => {
        const redis = createMockRedis();
        const store = new RedisDedupStore(redis, 30_000);
        await store.register("s1", "req-1");
        await store.register("s1", "req-2");
        await store.register("s2", "req-3");

        await store.remove("s1");

        expect(await store.isDuplicate("s1", "req-1")).toBe(false);
        expect(await store.isDuplicate("s1", "req-2")).toBe(false);
        expect(await store.isDuplicate("s2", "req-3")).toBe(true);
    });
});

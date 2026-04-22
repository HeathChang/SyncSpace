import { DedupStore } from "./dedup-store";

describe("DedupStore", () => {
    describe("isDuplicate / register", () => {
        it("should return false for a new requestId", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            expect(store.isDuplicate("s1", "req-1")).toBe(false);
        });

        it("should return true after registering the same requestId", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            store.register("s1", "req-1");
            expect(store.isDuplicate("s1", "req-1")).toBe(true);
        });

        it("should isolate requestIds per socket", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            store.register("s1", "req-1");
            expect(store.isDuplicate("s2", "req-1")).toBe(false);
        });
    });

    describe("TTL expiry", () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date("2026-04-21T00:00:00Z"));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should expire entries older than ttlMs", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            store.register("s1", "req-1");

            jest.setSystemTime(new Date("2026-04-21T00:00:01.500Z"));
            expect(store.isDuplicate("s1", "req-1")).toBe(false);
        });

        it("should keep entries within ttlMs", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            store.register("s1", "req-1");

            jest.setSystemTime(new Date("2026-04-21T00:00:00.500Z"));
            expect(store.isDuplicate("s1", "req-1")).toBe(true);
        });
    });

    describe("maxPerSocket eviction", () => {
        it("should evict oldest when exceeding maxPerSocket", () => {
            const store = new DedupStore({ ttlMs: 60_000, maxPerSocket: 3 });
            store.register("s1", "req-1");
            store.register("s1", "req-2");
            store.register("s1", "req-3");
            store.register("s1", "req-4");

            expect(store.isDuplicate("s1", "req-1")).toBe(false);
            expect(store.isDuplicate("s1", "req-4")).toBe(true);
        });
    });

    describe("remove", () => {
        it("should clear all requestIds for a socket on remove", () => {
            const store = new DedupStore({ ttlMs: 1000, maxPerSocket: 10 });
            store.register("s1", "req-1");
            store.remove("s1");
            expect(store.isDuplicate("s1", "req-1")).toBe(false);
        });
    });
});

import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date("2026-04-26T00:00:00Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("consume", () => {
        it("should allow up to capacity tokens immediately", () => {
            const limiter = new RateLimiter({ capacity: 3, refillTokensPerSecond: 1 });
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
        });

        it("should reject after capacity is exhausted", () => {
            const limiter = new RateLimiter({ capacity: 2, refillTokensPerSecond: 1 });
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(false);
        });

        it("should refill tokens over time", () => {
            const limiter = new RateLimiter({ capacity: 2, refillTokensPerSecond: 2 });
            limiter.consume("s1", "ev");
            limiter.consume("s1", "ev");
            expect(limiter.consume("s1", "ev")).toBe(false);

            jest.setSystemTime(new Date("2026-04-26T00:00:01Z"));
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(false);
        });

        it("should isolate buckets per (socket, event)", () => {
            const limiter = new RateLimiter({ capacity: 1, refillTokensPerSecond: 0 });
            expect(limiter.consume("s1", "evA")).toBe(true);
            expect(limiter.consume("s1", "evA")).toBe(false);
            expect(limiter.consume("s1", "evB")).toBe(true);
            expect(limiter.consume("s2", "evA")).toBe(true);
        });

        it("should cap refilled tokens at capacity", () => {
            const limiter = new RateLimiter({ capacity: 3, refillTokensPerSecond: 100 });
            limiter.consume("s1", "ev");
            jest.setSystemTime(new Date("2026-04-26T00:00:10Z"));
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(true);
            expect(limiter.consume("s1", "ev")).toBe(false);
        });
    });

    describe("removeSocket", () => {
        it("should clear all buckets for a socket", () => {
            const limiter = new RateLimiter({ capacity: 1, refillTokensPerSecond: 0 });
            limiter.consume("s1", "evA");
            limiter.consume("s1", "evB");
            limiter.removeSocket("s1");
            expect(limiter.consume("s1", "evA")).toBe(true);
            expect(limiter.consume("s1", "evB")).toBe(true);
        });

        it("should not affect other sockets", () => {
            const limiter = new RateLimiter({ capacity: 1, refillTokensPerSecond: 0 });
            limiter.consume("s1", "ev");
            limiter.consume("s2", "ev");
            limiter.removeSocket("s1");
            expect(limiter.consume("s2", "ev")).toBe(false);
        });
    });
});

import { createRequestId } from "./request-id";

describe("createRequestId", () => {
    it("should return a non-empty string", () => {
        const id = createRequestId();
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
    });

    it("should produce unique values on consecutive calls", () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i += 1) {
            ids.add(createRequestId());
        }
        expect(ids.size).toBe(100);
    });

    it("should fall back to non-crypto format when crypto.randomUUID is unavailable", () => {
        const originalRandomUUID = globalThis.crypto?.randomUUID;
        Object.defineProperty(globalThis.crypto, "randomUUID", {
            value: undefined,
            configurable: true,
        });

        const id = createRequestId();
        expect(id).toMatch(/^req-\d+-[a-z0-9]+$/);

        Object.defineProperty(globalThis.crypto, "randomUUID", {
            value: originalRandomUUID,
            configurable: true,
        });
    });
});

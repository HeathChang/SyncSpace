import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
    it("should produce a hash that verifies the same password", async () => {
        const hash = await hashPassword("super-secret");
        expect(hash).not.toBe("super-secret");
        expect(await verifyPassword("super-secret", hash)).toBe(true);
    });

    it("should reject incorrect password", async () => {
        const hash = await hashPassword("super-secret");
        expect(await verifyPassword("wrong-password", hash)).toBe(false);
    });

    it("should produce different hashes for the same input (salt)", async () => {
        const a = await hashPassword("same-password");
        const b = await hashPassword("same-password");
        expect(a).not.toBe(b);
    });
});

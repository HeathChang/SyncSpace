import { signAccessToken, verifyAccessToken } from "./jwt";

describe("JWT utilities", () => {
    describe("signAccessToken / verifyAccessToken", () => {
        it("should round-trip a valid payload", () => {
            const token = signAccessToken({ userId: "u1", name: "김민수" });
            const decoded = verifyAccessToken(token);
            expect(decoded).toEqual({ userId: "u1", name: "김민수" });
        });

        it("should return null for a malformed token", () => {
            expect(verifyAccessToken("not-a-jwt")).toBeNull();
        });

        it("should return null for an empty token", () => {
            expect(verifyAccessToken("")).toBeNull();
        });

        it("should return null for a token signed with a different secret", () => {
            const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
            const otherToken = jwt.sign({ userId: "u1", name: "hacker" }, "different-secret");
            expect(verifyAccessToken(otherToken)).toBeNull();
        });

        it("should return null when payload lacks required fields", () => {
            const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
            const secret = process.env.JWT_SECRET ?? "dev-only-secret-change-in-production";
            const tokenMissingName = jwt.sign({ userId: "u1" }, secret);
            expect(verifyAccessToken(tokenMissingName)).toBeNull();
        });
    });
});

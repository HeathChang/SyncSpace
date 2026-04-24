import type { Socket } from "socket.io";
import { socketAuthMiddleware } from "./socket-auth";
import { AUTH_COOKIE_NAME, signAccessToken } from "./jwt";

const makeSocket = (cookieHeader?: string): Socket => {
    return {
        handshake: {
            headers: cookieHeader ? { cookie: cookieHeader } : {},
        },
        data: {},
    } as unknown as Socket;
};

describe("socketAuthMiddleware", () => {
    it("should reject connection when no cookie is present", () => {
        const socket = makeSocket();
        const next = jest.fn();
        socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe("UNAUTHORIZED");
    });

    it("should reject connection when token cookie is missing", () => {
        const socket = makeSocket("other=value");
        const next = jest.fn();
        socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject connection when token is invalid", () => {
        const socket = makeSocket(`${AUTH_COOKIE_NAME}=invalid-token`);
        const next = jest.fn();
        socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should populate socket.data and call next() without error for valid token", () => {
        const token = signAccessToken({ userId: "u1", name: "김민수" });
        const socket = makeSocket(`${AUTH_COOKIE_NAME}=${token}`);
        const next = jest.fn();
        socketAuthMiddleware(socket, next);

        expect(next).toHaveBeenCalledWith();
        expect(socket.data.userId).toBe("u1");
        expect((socket.data as { userName?: string }).userName).toBe("김민수");
    });
});

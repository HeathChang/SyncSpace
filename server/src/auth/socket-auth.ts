import type { Socket } from "socket.io";
import cookie from "cookie";
import { AUTH_COOKIE_NAME, verifyAccessToken } from "./jwt";

/**
 * Socket.IO handshake 인증 미들웨어.
 * - httpOnly 쿠키의 JWT를 파싱하여 socket.data에 userId/name 주입.
 * - 토큰이 없거나 검증 실패 시 연결 거부.
 */
export const socketAuthMiddleware = (
    socket: Socket,
    next: (err?: Error) => void,
): void => {
    const rawCookie = socket.handshake.headers.cookie ?? "";
    const parsed = cookie.parse(rawCookie);
    const token = parsed[AUTH_COOKIE_NAME];

    if (!token) {
        next(new Error("UNAUTHORIZED"));
        return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        next(new Error("UNAUTHORIZED"));
        return;
    }

    socket.data.userId = payload.userId;
    socket.data.userName = payload.name;
    next();
};

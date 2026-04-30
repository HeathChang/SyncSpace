import { Router } from "express";
import type { Request, Response } from "express";
import { AUTH_COOKIE_NAME, signAccessToken, verifyAccessToken } from "./jwt";
import { findUserByCredentials } from "./user-store";
import { logger } from "../logger";

const COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const COOKIE_SECURE = process.env.NODE_ENV === "production";

export const authRouter: Router = Router();

authRouter.post("/login", async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { userId?: unknown; password?: unknown };
    const userId = typeof body.userId === "string" ? body.userId : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    if (!userId || !password) {
        res.status(400).json({ ok: false, error: "userId and password are required" });
        return;
    }

    const user = await findUserByCredentials(userId, password);
    if (!user) {
        res.status(401).json({ ok: false, error: "invalid credentials" });
        return;
    }

    const token = signAccessToken({ userId: user.id, name: user.name });
    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_MS,
    });

    logger.info({ userId: user.id }, "user logged in");
    res.json({ ok: true, data: { userId: user.id, name: user.name } });
});

authRouter.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "lax",
    });
    res.json({ ok: true });
});

authRouter.get("/me", (req: Request, res: Response) => {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
    const token = cookies[AUTH_COOKIE_NAME];
    if (!token) {
        res.status(401).json({ ok: false, error: "no token" });
        return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        res.status(401).json({ ok: false, error: "invalid token" });
        return;
    }

    res.json({ ok: true, data: payload });
});

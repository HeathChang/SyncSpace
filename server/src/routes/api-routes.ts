import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { listMessagesByRoom } from "../repositories/message-repository";
import { listCardsByRoom } from "../repositories/board-repository";
import { AUTH_COOKIE_NAME, verifyAccessToken } from "../auth/jwt";

const requireAuth = (req: Request): string | null => {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
    const token = cookies[AUTH_COOKIE_NAME];
    if (!token) return null;
    const payload = verifyAccessToken(token);
    return payload?.userId ?? null;
};

export const apiRouter: Router = Router();

apiRouter.get("/rooms", async (req: Request, res: Response) => {
    if (!requireAuth(req)) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }

    const rooms = await prisma.room.findMany({
        orderBy: { id: "asc" },
    });
    res.json({ ok: true, data: rooms });
});

apiRouter.get("/rooms/:roomId/messages", async (req: Request, res: Response) => {
    if (!requireAuth(req)) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

    const messages = await listMessagesByRoom(req.params.roomId, limit);
    const userIds = [...new Set(messages.map((message) => message.userId))];
    const authors = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    res.json({
        ok: true,
        data: messages.map((message) => ({
            id: message.id,
            roomId: message.roomId,
            authorId: message.userId,
            authorName: authorMap.get(message.userId) ?? "알 수 없음",
            content: message.content,
            createdAt: message.createdAt.toISOString(),
        })),
    });
});

apiRouter.get("/rooms/:roomId/cards", async (req: Request, res: Response) => {
    if (!requireAuth(req)) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }

    const cards = await listCardsByRoom(req.params.roomId);
    res.json({
        ok: true,
        data: cards.map((card) => ({
            id: card.id,
            title: card.title,
            assigneeId: card.assigneeId,
            column: card.column,
            tags: card.tags,
            updatedAt: card.updatedAt.toISOString(),
        })),
    });
});

apiRouter.get("/users", async (req: Request, res: Response) => {
    if (!requireAuth(req)) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }

    const users = await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
    });
    res.json({ ok: true, data: users });
});

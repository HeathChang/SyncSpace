import { prisma } from "../db/prisma";
import type { NotificationKind } from "./types";

export interface NotificationRecord {
    id: string;
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    createdAt: string;
    readAt?: string;
    meta?: Record<string, string>;
}

interface CreateInput {
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    meta?: Record<string, string>;
}

const decodeMeta = (raw: string | null): Record<string, string> | undefined => {
    if (!raw) return undefined;
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object") {
            return parsed as Record<string, string>;
        }
    } catch {
        // fall through
    }
    return undefined;
};

const toRecord = (row: {
    id: string;
    userId: string;
    kind: string;
    title: string;
    body: string;
    meta: string | null;
    createdAt: Date;
    readAt: Date | null;
}): NotificationRecord => ({
    id: row.id,
    userId: row.userId,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : undefined,
    meta: decodeMeta(row.meta),
});

export class NotificationStore {
    async create(input: CreateInput): Promise<NotificationRecord> {
        const row = await prisma.notification.create({
            data: {
                userId: input.userId,
                kind: input.kind,
                title: input.title,
                body: input.body,
                meta: input.meta ? JSON.stringify(input.meta) : null,
            },
        });
        return toRecord(row);
    }

    async listForUser(userId: string, limit = 100): Promise<NotificationRecord[]> {
        const rows = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        return rows.map(toRecord);
    }

    async markRead(userId: string, notificationId: string): Promise<boolean> {
        const found = await prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!found || found.userId !== userId || found.readAt) return false;

        await prisma.notification.update({
            where: { id: notificationId },
            data: { readAt: new Date() },
        });
        return true;
    }

    async unreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: { userId, readAt: null },
        });
    }
}

import { randomUUID } from "crypto";
import type { Notification, NotificationKind } from "./types";

const MAX_PER_USER = 100;

interface CreateInput {
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    meta?: Record<string, string>;
}

export class NotificationStore {
    private readonly notifications = new Map<string, Notification[]>();

    create(input: CreateInput): Notification {
        const notification: Notification = {
            id: randomUUID(),
            userId: input.userId,
            kind: input.kind,
            title: input.title,
            body: input.body,
            createdAt: new Date().toISOString(),
            meta: input.meta,
        };

        const list = this.notifications.get(input.userId) ?? [];
        list.unshift(notification);

        if (list.length > MAX_PER_USER) {
            list.length = MAX_PER_USER;
        }

        this.notifications.set(input.userId, list);
        return notification;
    }

    listForUser(userId: string): Notification[] {
        return this.notifications.get(userId) ?? [];
    }

    markRead(userId: string, notificationId: string): boolean {
        const list = this.notifications.get(userId);
        if (!list) return false;

        const found = list.find((item) => item.id === notificationId);
        if (!found || found.readAt) return false;

        found.readAt = new Date().toISOString();
        return true;
    }

    unreadCount(userId: string): number {
        const list = this.notifications.get(userId);
        if (!list) return 0;
        return list.filter((item) => !item.readAt).length;
    }
}

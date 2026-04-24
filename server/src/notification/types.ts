export type NotificationKind = "board:assigned" | "board:mentioned" | "system:info";

export interface Notification {
    id: string;
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    createdAt: string;
    readAt?: string;
    meta?: Record<string, string>;
}

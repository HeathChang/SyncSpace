import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { Notification, NotificationKind } from "@/entities/notification";

type BoardUpdatedPayload =
  | {
      roomId: string;
      action: "create";
      card: BoardCard;
    }
  | {
      roomId: string;
      action: "move";
      cardId: string;
      toColumn: BoardColumnId;
      updatedAt: string;
    }
  | {
      roomId: string;
      action: "delete";
      cardId: string;
    };

export type { BoardUpdatedPayload };

export type MessagePayload = {
  roomId: string;
  userId: string;
  message: string;
  timestamp: string;
};

export const hasUserId = (data: unknown): data is { userId: string } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "userId" in data &&
    typeof (data as { userId: unknown }).userId === "string"
  );
};

export const hasMessagePayload = (
  data: unknown,
): data is MessagePayload => {
  return (
    typeof data === "object" &&
    data !== null &&
    "roomId" in data &&
    typeof (data as { roomId: unknown }).roomId === "string" &&
    "userId" in data &&
    typeof (data as { userId: unknown }).userId === "string" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string" &&
    "timestamp" in data &&
    typeof (data as { timestamp: unknown }).timestamp === "string"
  );
};

export const hasPresenceSnapshotPayload = (
  data: unknown,
): data is {
  userIds: string[];
} => {
  return (
    typeof data === "object" &&
    data !== null &&
    "userIds" in data &&
    Array.isArray((data as { userIds: unknown }).userIds) &&
    (data as { userIds: unknown[] }).userIds.every((userId) => typeof userId === "string")
  );
};

const isBoardColumn = (value: unknown): value is BoardColumnId =>
  value === "todo" || value === "inProgress" || value === "done";

export const hasBoardUpdatedPayload = (data: unknown): data is BoardUpdatedPayload => {
  if (typeof data !== "object" || data === null || !("roomId" in data) || !("action" in data)) {
    return false;
  }

  const action = (data as { action: unknown }).action;
  const roomId = (data as { roomId: unknown }).roomId;
  if (typeof roomId !== "string") {
    return false;
  }

  if (action === "create") {
    const card = (data as { card?: unknown }).card;
    return (
      typeof card === "object" &&
      card !== null &&
      "id" in card &&
      typeof (card as { id: unknown }).id === "string" &&
      "title" in card &&
      typeof (card as { title: unknown }).title === "string" &&
      "assigneeId" in card &&
      typeof (card as { assigneeId: unknown }).assigneeId === "string" &&
      "column" in card &&
      isBoardColumn((card as { column: unknown }).column) &&
      "updatedAt" in card &&
      typeof (card as { updatedAt: unknown }).updatedAt === "string" &&
      "tags" in card &&
      Array.isArray((card as { tags: unknown }).tags)
    );
  }

  if (action === "move") {
    return (
      "cardId" in data &&
      typeof (data as { cardId: unknown }).cardId === "string" &&
      "toColumn" in data &&
      isBoardColumn((data as { toColumn: unknown }).toColumn) &&
      "updatedAt" in data &&
      typeof (data as { updatedAt: unknown }).updatedAt === "string"
    );
  }

  if (action === "delete") {
    return "cardId" in data && typeof (data as { cardId: unknown }).cardId === "string";
  }

  return false;
};

const isNotificationKind = (value: unknown): value is NotificationKind =>
  value === "board:assigned" || value === "board:mentioned" || value === "system:info";

export const hasNotification = (data: unknown): data is Notification => {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.userId === "string" &&
    isNotificationKind(candidate.kind) &&
    typeof candidate.title === "string" &&
    typeof candidate.body === "string" &&
    typeof candidate.createdAt === "string"
  );
};

export const hasNotificationSnapshot = (
  data: unknown,
): data is { notifications: Notification[]; unreadCount: number } => {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Record<string, unknown>;
  if (!Array.isArray(candidate.notifications)) return false;
  if (typeof candidate.unreadCount !== "number") return false;
  return candidate.notifications.every(hasNotification);
};

export const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "지금";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

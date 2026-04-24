import type { AckCallback, RequestEnvelope } from "./socket.envelope";

export enum eServerToClientEvents {
    USER_ONLINE = "user:online",
    USER_OFFLINE = "user:offline",
    PRESENCE_SNAPSHOT = "presence:snapshot",
    MESSAGE_NEW = "message:new",
    BOARD_UPDATED = "board:updated",
    NOTIFICATION_NEW = "notification:new",
    NOTIFICATION_SNAPSHOT = "notification:snapshot",
}

export enum eClientToServerEvents {
    USER_JOIN = "user:join",
    MESSAGE_SEND = "message:send",
    BOARD_CREATE = "board:create",
    BOARD_MOVE = "board:move",
    BOARD_DELETE = "board:delete",
    CURSOR_MOVE = "cursor:move",
    ROOM_JOIN = "room:join",
    ROOM_LEAVE = "room:leave",
    NOTIFICATION_READ = "notification:read",
}

export type NotificationKind = "board:assigned" | "board:mentioned" | "system:info";

export interface NotificationDto {
    id: string;
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    createdAt: string;
    readAt?: string;
    meta?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserJoinReq {}

export interface MessageSendReq {
    roomId: string;
    message: string;
}

export interface BoardCreateReq {
    roomId: string;
    cardId: string;
    title: string;
    assigneeId: string;
    tags: string[];
}

export interface BoardMoveReq {
    roomId: string;
    cardId: string;
    toColumn: "todo" | "inProgress" | "done";
}

export interface BoardDeleteReq {
    roomId: string;
    cardId: string;
}

export interface RoomReq {
    roomId: string;
}

export interface NotificationReadReq {
    notificationId: string;
}

// Server → Client Events
export interface ServerToClientEvents {
    [eServerToClientEvents.USER_ONLINE]: { userId: string };
    [eServerToClientEvents.USER_OFFLINE]: { userId: string };
    [eServerToClientEvents.PRESENCE_SNAPSHOT]: { userIds: string[] };
    [eServerToClientEvents.MESSAGE_NEW]: {
        roomId: string;
        userId: string;
        message: string;
        timestamp: string;
    };
    [eServerToClientEvents.BOARD_UPDATED]:
        | {
            roomId: string;
            action: "create";
            card: {
                id: string;
                title: string;
                assigneeId: string;
                column: "todo" | "inProgress" | "done";
                updatedAt: string;
                tags: string[];
            };
        }
        | {
            roomId: string;
            action: "move";
            cardId: string;
            toColumn: "todo" | "inProgress" | "done";
            updatedAt: string;
        }
        | {
            roomId: string;
            action: "delete";
            cardId: string;
        };
    [eServerToClientEvents.NOTIFICATION_NEW]: NotificationDto;
    [eServerToClientEvents.NOTIFICATION_SNAPSHOT]: {
        notifications: NotificationDto[];
        unreadCount: number;
    };
}

// Client → Server Events
export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: (
        payload: RequestEnvelope<UserJoinReq>,
        ack: AckCallback<{ userIds: string[]; userId: string; name: string }>,
    ) => void;
    [eClientToServerEvents.MESSAGE_SEND]: (
        payload: RequestEnvelope<MessageSendReq>,
        ack: AckCallback<{ messageId: string; timestamp: string }>,
    ) => void;
    [eClientToServerEvents.BOARD_CREATE]: (
        payload: RequestEnvelope<BoardCreateReq>,
        ack: AckCallback,
    ) => void;
    [eClientToServerEvents.BOARD_MOVE]: (
        payload: RequestEnvelope<BoardMoveReq>,
        ack: AckCallback,
    ) => void;
    [eClientToServerEvents.BOARD_DELETE]: (
        payload: RequestEnvelope<BoardDeleteReq>,
        ack: AckCallback,
    ) => void;
    [eClientToServerEvents.CURSOR_MOVE]: (
        payload: RequestEnvelope<{ x: number; y: number }>,
    ) => void;
    [eClientToServerEvents.ROOM_JOIN]: (
        payload: RequestEnvelope<RoomReq>,
        ack: AckCallback,
    ) => void;
    [eClientToServerEvents.ROOM_LEAVE]: (
        payload: RequestEnvelope<RoomReq>,
        ack: AckCallback,
    ) => void;
    [eClientToServerEvents.NOTIFICATION_READ]: (
        payload: RequestEnvelope<NotificationReadReq>,
        ack: AckCallback,
    ) => void;
}

export interface iSocketProvider {
    children: React.ReactNode;
    url: string;
}

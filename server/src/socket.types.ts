import type { AckCallback, RequestEnvelope } from "./socket.envelope";
import type { Notification } from "./notification/types";

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

export interface UserJoinReq {
    // userId는 JWT에서 유추하므로 더 이상 페이로드로 받지 않는다.
    // 후방호환을 위해 비어 있는 객체를 허용.
}

export interface MessageSendReq {
    roomId: string;
    message: string;
}

export interface MessageSendData {
    messageId: string;
    timestamp: string;
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

export interface CursorMoveReq {
    x: number;
    y: number;
}

export interface RoomReq {
    roomId: string;
}

export interface NotificationReadReq {
    notificationId: string;
}

export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: (
        payload: RequestEnvelope<UserJoinReq>,
        ack: AckCallback<{ userIds: string[]; userId: string; name: string }>,
    ) => void;
    [eClientToServerEvents.MESSAGE_SEND]: (
        payload: RequestEnvelope<MessageSendReq>,
        ack: AckCallback<MessageSendData>,
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
        payload: RequestEnvelope<CursorMoveReq>,
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

export interface ServerToClientEvents {
    [eServerToClientEvents.USER_ONLINE]: (payload: { userId: string }) => void;
    [eServerToClientEvents.USER_OFFLINE]: (payload: { userId: string }) => void;
    [eServerToClientEvents.PRESENCE_SNAPSHOT]: (payload: { userIds: string[] }) => void;
    [eServerToClientEvents.MESSAGE_NEW]: (payload: {
        roomId: string;
        userId: string;
        message: string;
        timestamp: string;
    }) => void;
    [eServerToClientEvents.BOARD_UPDATED]: (payload:
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
        }) => void;
    [eServerToClientEvents.NOTIFICATION_NEW]: (payload: Notification) => void;
    [eServerToClientEvents.NOTIFICATION_SNAPSHOT]: (payload: {
        notifications: Notification[];
        unreadCount: number;
    }) => void;
}

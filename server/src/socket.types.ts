import type { AckCallback, RequestEnvelope } from "./socket.envelope";

export enum eServerToClientEvents {
    USER_ONLINE = "user:online",
    USER_OFFLINE = "user:offline",
    PRESENCE_SNAPSHOT = "presence:snapshot",
    MESSAGE_NEW = "message:new",
    BOARD_UPDATED = "board:updated",
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
}

export interface UserJoinReq {
    userId: string;
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

export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: (
        payload: RequestEnvelope<UserJoinReq>,
        ack: AckCallback<{ userIds: string[] }>,
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
}

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
    CURSOR_MOVE = "cursor:move",
    ROOM_JOIN = "room:join",
    ROOM_LEAVE = "room:leave",
}


export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: (payload: { userId: string }) => void;
    [eClientToServerEvents.MESSAGE_SEND]: (payload: { roomId: string; message: string }) => void;
    [eClientToServerEvents.BOARD_CREATE]: (payload: { roomId: string; title: string }) => void;
    [eClientToServerEvents.BOARD_MOVE]: (payload: {
        roomId: string;
        cardId: string;
        toColumn: string;
    }) => void;
    [eClientToServerEvents.CURSOR_MOVE]: (payload: { x: number; y: number }) => void;
    [eClientToServerEvents.ROOM_JOIN]: (payload: { roomId: string }) => void;
    [eClientToServerEvents.ROOM_LEAVE]: (payload: { roomId: string }) => void;
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
    [eServerToClientEvents.BOARD_UPDATED]: (payload: { roomId: string }) => void;
}

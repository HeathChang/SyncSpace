export enum eServerToClientEvents {
    USER_ONLINE = "user:online",
    USER_OFFLINE = "user:offline",
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
    "user:join": { userId: string };
}

export interface ServerToClientEvents {
    "user:online": { userId: string };
    "user:offline": { userId: string };
}

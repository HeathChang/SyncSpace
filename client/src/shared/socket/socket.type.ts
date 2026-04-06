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

// Server to Client Events
export interface ServerToClientEvents {
    [eServerToClientEvents.USER_ONLINE]: { userId: string };
    [eServerToClientEvents.USER_OFFLINE]: { userId: string };
    [eServerToClientEvents.MESSAGE_NEW]: { roomId: string; userId: string; message: string };
    [eServerToClientEvents.BOARD_UPDATED]: { roomId: string };
}

// Client to Server Events
export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: { userId: string };
    [eClientToServerEvents.MESSAGE_SEND]: { roomId: string; message: string };
    [eClientToServerEvents.BOARD_CREATE]: { roomId: string; title: string };
    [eClientToServerEvents.BOARD_MOVE]: { roomId: string; cardId: string; toColumn: string };
    [eClientToServerEvents.CURSOR_MOVE]: { x: number; y: number };
    [eClientToServerEvents.ROOM_JOIN]: { roomId: string };
    [eClientToServerEvents.ROOM_LEAVE]: { roomId: string };
}

export interface iSocketProvider {
    children: React.ReactNode;
    url: string;
}
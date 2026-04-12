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


export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: (payload: { userId: string }) => void;
    [eClientToServerEvents.MESSAGE_SEND]: (payload: { roomId: string; message: string }) => void;
    [eClientToServerEvents.BOARD_CREATE]: (payload: {
        roomId: string;
        cardId: string;
        title: string;
        assigneeId: string;
        tags: string[];
    }) => void;
    [eClientToServerEvents.BOARD_MOVE]: (payload: {
        roomId: string;
        cardId: string;
        toColumn: "todo" | "inProgress" | "done";
    }) => void;
    [eClientToServerEvents.BOARD_DELETE]: (payload: { roomId: string; cardId: string }) => void;
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

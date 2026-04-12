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

// Server to Client Events
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
}

// Client to Server Events
export interface ClientToServerEvents {
    [eClientToServerEvents.USER_JOIN]: { userId: string };
    [eClientToServerEvents.MESSAGE_SEND]: { roomId: string; message: string };
    [eClientToServerEvents.BOARD_CREATE]: {
        roomId: string;
        cardId: string;
        title: string;
        assigneeId: string;
        tags: string[];
    };
    [eClientToServerEvents.BOARD_MOVE]: {
        roomId: string;
        cardId: string;
        toColumn: "todo" | "inProgress" | "done";
    };
    [eClientToServerEvents.BOARD_DELETE]: { roomId: string; cardId: string };
    [eClientToServerEvents.CURSOR_MOVE]: { x: number; y: number };
    [eClientToServerEvents.ROOM_JOIN]: { roomId: string };
    [eClientToServerEvents.ROOM_LEAVE]: { roomId: string };
}

export interface iSocketProvider {
    children: React.ReactNode;
    url: string;
}
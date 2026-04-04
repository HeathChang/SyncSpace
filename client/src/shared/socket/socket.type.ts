
export interface ServerToClientEvents {
    "user:online": { userId: string };
    "user:offline": { userId: string };
    "message:new": { roomId: string; userId: string; message: string };
    "board:updated": { roomId: string };
}

export interface ClientToServerEvents {
    "user:join": { userId: string };
    "message:send": { roomId: string; message: string };
    "board:create": { roomId: string; title: string };
    "board:move": { roomId: string; cardId: string; toColumn: string };
    "cursor:move": { x: number; y: number };
    "room:join": { roomId: string };
    "room:leave": { roomId: string };
}

export interface iSocketProvider {
    children: React.ReactNode;
    url: string;
}
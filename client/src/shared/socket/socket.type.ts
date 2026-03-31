
export interface ServerToClientEvents {
    "user:join": { userId: string };
    "user:leave": { userId: string };
    "cursor:move": { x: number; y: number };
}

export interface ClientToServerEvents {
    "cursor:move": { x: number; y: number };
    "room:join": { roomId: string };
    "room:leave": { roomId: string };
}

export interface iSocketProvider {
    children: React.ReactNode;
    url: string;
}
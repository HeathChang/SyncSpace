export type PresenceStatus = "online" | "away" | "offline";

export interface WorkspaceUser {
    id: string;
    name: string;
    role: string;
    status: PresenceStatus;
    lastActiveAt: string;
}

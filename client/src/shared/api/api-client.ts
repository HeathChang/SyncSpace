"use client";

import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { Room } from "@/entities/room";
import type { WorkspaceUser } from "@/entities/user";

const buildUrl = (path: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
    return `${base}${path}`;
};

interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}

const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(buildUrl(path), { credentials: "include" });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.ok || json.data === undefined) {
        throw new Error(json.error ?? `request failed: ${path}`);
    }
    return json.data;
};

interface RoomDto {
    id: string;
    name: string;
    description: string;
    memberCount: number;
}

interface MessageDto {
    id: string;
    roomId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
}

interface CardDto {
    id: string;
    title: string;
    assigneeId: string;
    column: BoardColumnId;
    tags: string[];
    updatedAt: string;
}

interface UserDto {
    id: string;
    name: string;
}

const formatTime = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "지금";
    return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

export const fetchRooms = async (): Promise<Room[]> => {
    const rooms = await get<RoomDto[]>("/api/rooms");
    return rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        memberCount: room.memberCount,
        unreadCount: 0,
    }));
};

export const fetchMessages = async (roomId: string): Promise<ChatMessage[]> => {
    const messages = await get<MessageDto[]>(
        `/api/rooms/${encodeURIComponent(roomId)}/messages?limit=50`,
    );
    return messages.map((message) => ({
        id: message.id,
        roomId: message.roomId,
        authorId: message.authorId,
        authorName: message.authorName,
        content: message.content,
        createdAt: formatTime(message.createdAt),
    }));
};

export const fetchCards = async (roomId: string): Promise<BoardCard[]> => {
    const cards = await get<CardDto[]>(
        `/api/rooms/${encodeURIComponent(roomId)}/cards`,
    );
    return cards.map((card) => ({
        id: card.id,
        title: card.title,
        assigneeId: card.assigneeId,
        column: card.column,
        tags: card.tags,
        updatedAt: formatTime(card.updatedAt),
    }));
};

export const fetchUsers = async (): Promise<WorkspaceUser[]> => {
    const users = await get<UserDto[]>("/api/users");
    return users.map((user) => ({
        id: user.id,
        name: user.name,
        role: "Member",
        status: "offline" as const,
        lastActiveAt: "-",
    }));
};

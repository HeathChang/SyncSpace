"use client";

import { useEffect, useState } from "react";
import type { BoardCard } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { Room } from "@/entities/room";
import type { WorkspaceUser } from "@/entities/user";
import { fetchRooms, fetchMessages, fetchCards, fetchUsers } from "@/shared/api";
import { logger } from "@/shared/lib";

interface InitialData {
    rooms: Room[];
    users: WorkspaceUser[];
    messages: ChatMessage[];
    cards: BoardCard[];
    isLoading: boolean;
    selectedRoomId: string | null;
}

/**
 * 로그인 후 1회만 실행되는 초기 로딩 훅.
 * - rooms/users: 한 번만 로드
 * - messages/cards: 선택된 룸이 바뀔 때마다 재로드
 */
export const useInitialData = (
    selectedRoomId: string | null,
): InitialData & {
    setSelectedRoomId: (id: string) => void;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setCards: React.Dispatch<React.SetStateAction<BoardCard[]>>;
    setUsers: React.Dispatch<React.SetStateAction<WorkspaceUser[]>>;
} => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<WorkspaceUser[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [cards, setCards] = useState<BoardCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [internalSelectedRoomId, setInternalSelectedRoomId] = useState<string | null>(
        selectedRoomId,
    );

    useEffect(() => {
        let cancelled = false;
        const bootstrap = async () => {
            try {
                const [loadedRooms, loadedUsers] = await Promise.all([fetchRooms(), fetchUsers()]);
                if (cancelled) return;
                setRooms(loadedRooms);
                setUsers(loadedUsers);
                if (!internalSelectedRoomId && loadedRooms.length > 0) {
                    setInternalSelectedRoomId(loadedRooms[0].id);
                }
            } catch (error) {
                logger.warn("initial data load failed", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void bootstrap();
        return () => {
            cancelled = true;
        };
    }, [internalSelectedRoomId]);

    useEffect(() => {
        if (!internalSelectedRoomId) return;
        let cancelled = false;
        const loadRoomData = async () => {
            try {
                const [loadedMessages, loadedCards] = await Promise.all([
                    fetchMessages(internalSelectedRoomId),
                    fetchCards(internalSelectedRoomId),
                ]);
                if (cancelled) return;
                setMessages(loadedMessages);
                setCards(loadedCards);
            } catch (error) {
                logger.warn("room data load failed", error);
            }
        };
        void loadRoomData();
        return () => {
            cancelled = true;
        };
    }, [internalSelectedRoomId]);

    return {
        rooms,
        users,
        messages,
        cards,
        isLoading,
        selectedRoomId: internalSelectedRoomId,
        setSelectedRoomId: setInternalSelectedRoomId,
        setMessages,
        setCards,
        setUsers,
    };
};

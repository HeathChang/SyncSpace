"use client";

import { useMemo, useState } from "react";
import type { BoardCard } from "@/entities/board/model/types";
import type { ChatMessage } from "@/entities/message/model/types";
import {
  boardColumns,
  mockBoardCards,
  mockMessages,
  mockRooms,
  mockUsers,
  upcomingItems,
} from "@/shared/lib/mock-data";
import useSocket from "@/shared/hooks/useSocket";
import { MainDashboard } from "@/widgets/main-dashboard/ui/main-dashboard";
import { WorkspaceHeader } from "@/widgets/workspace-header/ui/workspace-header";

const currentUserId = "u2";

export function HomePage() {
  const [selectedRoomId, setSelectedRoomId] = useState(mockRooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [cards, setCards] = useState<BoardCard[]>(mockBoardCards);
  const { connection, setConnection } = useSocket();

  const selectedRoom = useMemo(
    () => mockRooms.find((room) => room.id === selectedRoomId) ?? mockRooms[0],
    [selectedRoomId],
  );

  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === selectedRoom.id),
    [messages, selectedRoom.id],
  );

  const handleSendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        roomId: selectedRoom.id,
        authorId: currentUserId,
        authorName: "박서연",
        content: trimmed,
        createdAt: "지금",
      },
    ]);
  };

  const handleReconnect = () => {
    setConnection((prev) => ({
      ...prev,
      isConnected: true,
      reconnectAttempts: prev.reconnectAttempts + 1,
      latencyMs: Math.max(18, Math.floor(Math.random() * 80)),
      lastConnectedAt: "방금 전",
    }));
  };

  const handleMoveCard = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) {
          return card;
        }

        const nextColumn =
          card.column === "todo"
            ? "inProgress"
            : card.column === "inProgress"
              ? "done"
              : "todo";

        return {
          ...card,
          column: nextColumn,
          updatedAt: "방금 전",
        };
      }),
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const handleCreateCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: `신규 작업 ${prev.length + 1}`,
        assigneeId: currentUserId,
        column: "todo",
        updatedAt: "방금 전",
        tags: ["신규"],
      },
    ]);
  };

  return (
    <main className="app-shell">
      <WorkspaceHeader
        currentRoom={selectedRoom}
        users={mockUsers}
        connection={connection}
      />

      <MainDashboard
        rooms={mockRooms}
        selectedRoomId={selectedRoomId}
        selectedRoom={selectedRoom}
        roomMessages={roomMessages}
        users={mockUsers}
        columns={boardColumns}
        cards={cards}
        connection={connection}
        upcomingItems={upcomingItems}
        onSelectRoom={setSelectedRoomId}
        onSendMessage={handleSendMessage}
        onReconnect={handleReconnect}
        onCreateCard={handleCreateCard}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
      />
    </main>
  );
}

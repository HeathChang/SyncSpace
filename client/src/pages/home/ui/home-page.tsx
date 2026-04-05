"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BoardCard } from "@/entities/board/model/types";
import type { ChatMessage } from "@/entities/message/model/types";
import type { PresenceStatus, WorkspaceUser } from "@/entities/user/model/types";
import {
  boardColumns,
  mockBoardCards,
  mockMessages,
  mockRooms,
  mockUsers,
  upcomingItems,
} from "@/shared/lib/mock-data";
import { useSocket } from "@/shared/socket/useSocket";
import { useSocketEvent } from "@/shared/socket/useSocketEvent";
import { MainDashboard } from "@/widgets/main-dashboard/ui/main-dashboard";
import { WorkspaceHeader } from "@/widgets/workspace-header/ui/workspace-header";

const currentUserId = "u2";
const activeNowText = "방금 전";

const hasUserId = (data: unknown): data is { userId: string } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "userId" in data &&
    typeof (data as { userId: unknown }).userId === "string"
  );
};

export function HomePage() {
  const [selectedRoomId, setSelectedRoomId] = useState(mockRooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [cards, setCards] = useState<BoardCard[]>(mockBoardCards);
  const [users, setUsers] = useState<WorkspaceUser[]>(mockUsers);
  const { socket, connection } = useSocket();

  const setUserStatus = useCallback((userId: string, status: PresenceStatus) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
            ...user,
            status,
            lastActiveAt: activeNowText,
          }
          : user,
      ),
    );
  }, []);

  const handleUserOnline = useCallback(
    (payload: unknown) => {
      if (!hasUserId(payload)) {
        return;
      }

      setUserStatus(payload.userId, "online");
    },
    [setUserStatus],
  );

  const handleUserOffline = useCallback(
    (payload: unknown) => {
      if (!hasUserId(payload)) {
        return;
      }

      setUserStatus(payload.userId, "offline");
    },
    [setUserStatus],
  );

  useSocketEvent({ event: "user:online", handler: handleUserOnline });
  useSocketEvent({ event: "user:offline", handler: handleUserOffline });

  useEffect(() => {
    if (connection.isConnected) {
      socket.emit("user:join", { userId: currentUserId });
    }
  }, [connection.isConnected, socket]);

  useEffect(() => {
    if (!connection.isConnected) {
      return;
    }

    socket.emit("room:join", { roomId: selectedRoomId });

    return () => {
      socket.emit("room:leave", { roomId: selectedRoomId });
    };
  }, [connection.isConnected, selectedRoomId, socket]);

  const selectedRoom = useMemo(
    () => mockRooms.find((room) => room.id === selectedRoomId) ?? mockRooms[0],
    [selectedRoomId],
  );

  const usersWithConnection = useMemo(
    () => {
      const currentUserPresence: PresenceStatus = connection.isConnected
        ? "online"
        : "offline";

      return users.map((user) =>
        user.id === currentUserId
          ? {
            ...user,
            status: currentUserPresence,
          }
          : user,
      );
    },
    [connection.isConnected, users],
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

    socket.emit("message:send", {
      roomId: selectedRoom.id,
      message: trimmed,
    });

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

  const handleReconnect = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }, [socket]);

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
        users={usersWithConnection}
        connection={connection}
      />

      <MainDashboard
        rooms={mockRooms}
        selectedRoomId={selectedRoomId}
        selectedRoom={selectedRoom}
        roomMessages={roomMessages}
        users={usersWithConnection}
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

export default HomePage;

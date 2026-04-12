"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardCard, BoardColumnId } from "@/entities/board/model/types";
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
import { useSocketEmit } from "@/shared/socket/useSocketEmit";
import { eClientToServerEvents, eServerToClientEvents } from "@/shared/socket/socket.type";
import { useQueueStack } from "@/shared/socket/useQueueStack";

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

const hasMessagePayload = (
  data: unknown,
): data is {
  roomId: string;
  userId: string;
  message: string;
  timestamp: string;
} => {
  return (
    typeof data === "object" &&
    data !== null &&
    "roomId" in data &&
    typeof (data as { roomId: unknown }).roomId === "string" &&
    "userId" in data &&
    typeof (data as { userId: unknown }).userId === "string" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string" &&
    "timestamp" in data &&
    typeof (data as { timestamp: unknown }).timestamp === "string"
  );
};

type MessagePayload = {
  roomId: string;
  userId: string;
  message: string;
  timestamp: string;
};

type BoardUpdatedPayload =
  | {
      roomId: string;
      action: "create";
      card: BoardCard;
    }
  | {
      roomId: string;
      action: "move";
      cardId: string;
      toColumn: BoardColumnId;
      updatedAt: string;
    }
  | {
      roomId: string;
      action: "delete";
      cardId: string;
    };

const hasPresenceSnapshotPayload = (
  data: unknown,
): data is {
  userIds: string[];
} => {
  return (
    typeof data === "object" &&
    data !== null &&
    "userIds" in data &&
    Array.isArray((data as { userIds: unknown }).userIds) &&
    (data as { userIds: unknown[] }).userIds.every((userId) => typeof userId === "string")
  );
};

const isBoardColumn = (value: unknown): value is BoardColumnId =>
  value === "todo" || value === "inProgress" || value === "done";

const hasBoardUpdatedPayload = (data: unknown): data is BoardUpdatedPayload => {
  if (typeof data !== "object" || data === null || !("roomId" in data) || !("action" in data)) {
    return false;
  }

  const action = (data as { action: unknown }).action;
  const roomId = (data as { roomId: unknown }).roomId;
  if (typeof roomId !== "string") {
    return false;
  }

  if (action === "create") {
    const card = (data as { card?: unknown }).card;
    return (
      typeof card === "object" &&
      card !== null &&
      "id" in card &&
      typeof (card as { id: unknown }).id === "string" &&
      "title" in card &&
      typeof (card as { title: unknown }).title === "string" &&
      "assigneeId" in card &&
      typeof (card as { assigneeId: unknown }).assigneeId === "string" &&
      "column" in card &&
      isBoardColumn((card as { column: unknown }).column) &&
      "updatedAt" in card &&
      typeof (card as { updatedAt: unknown }).updatedAt === "string" &&
      "tags" in card &&
      Array.isArray((card as { tags: unknown }).tags)
    );
  }

  if (action === "move") {
    return (
      "cardId" in data &&
      typeof (data as { cardId: unknown }).cardId === "string" &&
      "toColumn" in data &&
      isBoardColumn((data as { toColumn: unknown }).toColumn) &&
      "updatedAt" in data &&
      typeof (data as { updatedAt: unknown }).updatedAt === "string"
    );
  }

  if (action === "delete") {
    return "cardId" in data && typeof (data as { cardId: unknown }).cardId === "string";
  }

  return false;
};

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "지금";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export function HomePage() {
  const [selectedRoomId, setSelectedRoomId] = useState(mockRooms[0].id); // 선택된 방의 ID
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages); // 메시지 목록
  const [cards, setCards] = useState<BoardCard[]>(mockBoardCards); // 카드 목록
  const [users, setUsers] = useState<WorkspaceUser[]>(mockUsers); // 사용자 목록
  const { socket, connection } = useSocket(); // 소켓 연결 상태
  const { emit } = useSocketEmit(); // 소켓 이벤트 발신
  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const processQueuedMessage = useCallback((nextMessage: MessagePayload) => {
    const authorName =
      usersRef.current.find((user) => user.id === nextMessage.userId)?.name ?? "알 수 없음";

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        roomId: nextMessage.roomId,
        authorId: nextMessage.userId,
        authorName,
        content: nextMessage.message,
        createdAt: formatMessageTime(nextMessage.timestamp),
      },
    ]);
  }, []);

  const { enqueue } = useQueueStack<MessagePayload>({
    onDequeue: processQueuedMessage,
    intervalMs: 300,
  });

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

  const handleMessageNew = useCallback(
    (payload: unknown) => {
      if (!hasMessagePayload(payload)) {
        return;
      }

      enqueue(payload);
    },
    [enqueue],
  );

  const handlePresenceSnapshot = useCallback((payload: unknown) => {
    if (!hasPresenceSnapshotPayload(payload)) {
      return;
    }

    const onlineUserIds = new Set(payload.userIds);
    setUsers((prev) =>
      prev.map((user) =>
        onlineUserIds.has(user.id)
          ? {
              ...user,
              status: "online",
              lastActiveAt: activeNowText,
            }
          : {
              ...user,
              status: "offline",
            },
      ),
    );
  }, []);

  const handleBoardUpdated = useCallback(
    (payload: unknown) => {
      if (!hasBoardUpdatedPayload(payload) || payload.roomId !== selectedRoomId) {
        return;
      }

      setCards((prev) => {
        if (payload.action === "create") {
          if (prev.some((card) => card.id === payload.card.id)) {
            return prev;
          }

          return [...prev, payload.card];
        }

        if (payload.action === "move") {
          return prev.map((card) =>
            card.id === payload.cardId
              ? {
                  ...card,
                  column: payload.toColumn,
                  updatedAt: payload.updatedAt,
                }
              : card,
          );
        }

        return prev.filter((card) => card.id !== payload.cardId);
      });
    },
    [selectedRoomId],
  );

  useSocketEvent({ event: eServerToClientEvents.USER_ONLINE, handler: handleUserOnline });
  useSocketEvent({ event: eServerToClientEvents.USER_OFFLINE, handler: handleUserOffline });
  useSocketEvent({
    event: eServerToClientEvents.PRESENCE_SNAPSHOT,
    handler: handlePresenceSnapshot,
  });
  useSocketEvent({ event: eServerToClientEvents.MESSAGE_NEW, handler: handleMessageNew });
  useSocketEvent({ event: eServerToClientEvents.BOARD_UPDATED, handler: handleBoardUpdated });

  useEffect(() => {
    if (connection.isConnected) {
      emit(eClientToServerEvents.USER_JOIN, { userId: currentUserId });
    }
  }, [connection.isConnected, emit]);

  useEffect(() => {
    if (!connection.isConnected) {
      return;
    }

    emit(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId });

    return () => {
      emit(eClientToServerEvents.ROOM_LEAVE, { roomId: selectedRoomId });
    };
  }, [connection.isConnected, selectedRoomId, emit]);

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

    emit(eClientToServerEvents.MESSAGE_SEND, {
      roomId: selectedRoom.id,
      message: trimmed,
    });
  };

  const handleReconnect = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }, [socket]);

  const handleMoveCard = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) {
      return;
    }

    const nextColumn: BoardColumnId =
      card.column === "todo" ? "inProgress" : card.column === "inProgress" ? "done" : "todo";

    emit(eClientToServerEvents.BOARD_MOVE, {
      roomId: selectedRoomId,
      cardId,
      toColumn: nextColumn,
    });
  };

  const handleDeleteCard = (cardId: string) => {
    emit(eClientToServerEvents.BOARD_DELETE, {
      roomId: selectedRoomId,
      cardId,
    });
  };

  const handleCreateCard = () => {
    emit(eClientToServerEvents.BOARD_CREATE, {
      roomId: selectedRoomId,
      cardId: crypto.randomUUID(),
      title: `신규 작업 ${cards.length + 1}`,
      assigneeId: currentUserId,
      tags: ["신규"],
    });
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

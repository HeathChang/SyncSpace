"use client";

import { useMemo, useState } from "react";
import type { BoardCard } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { Notification } from "@/entities/notification";
import type { PresenceStatus, WorkspaceUser } from "@/entities/user";
import {
  boardColumns,
  mockBoardCards,
  mockMessages,
  mockRooms,
  mockUsers,
  upcomingItems,
} from "@/shared/lib";
import { useSocket } from "@/shared/socket";
import { useAuth } from "@/features/auth";
import { MainDashboard } from "@/widgets/main-dashboard";
import { WorkspaceHeader } from "@/widgets/workspace-header";
import { useHomeSocket } from "../model/useHomeSocket";
import { useHomeActions } from "../model/useHomeActions";
import { useNotificationActions } from "../model/useNotificationActions";

export function HomeContainer() {
  const { user, logout } = useAuth();
  if (!user) {
    throw new Error("HomeContainer는 로그인된 상태에서만 렌더링되어야 합니다.");
  }

  const currentUserId = user.userId;

  const [selectedRoomId, setSelectedRoomId] = useState(mockRooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [cards, setCards] = useState<BoardCard[]>(mockBoardCards);
  const [users, setUsers] = useState<WorkspaceUser[]>(mockUsers);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket, connection } = useSocket();

  const { emitMain, emitBoard, emitChat } = useHomeSocket({
    currentUserId,
    selectedRoomId,
    isConnected: connection.isConnected,
    users,
    setMessages,
    setCards,
    setUsers,
    setNotifications,
  });

  const {
    handleSendMessage,
    handleReconnect,
    handleMoveCard,
    handleDeleteCard,
    handleCreateCard,
  } = useHomeActions({
    socket,
    emitChat,
    emitBoard,
    selectedRoomId,
    currentUserId,
    cards,
  });

  const { handleMarkNotificationRead } = useNotificationActions({
    emitAck: emitMain,
    setNotifications,
  });

  const selectedRoom = useMemo(
    () => mockRooms.find((room) => room.id === selectedRoomId) ?? mockRooms[0],
    [selectedRoomId],
  );

  const usersWithConnection = useMemo(() => {
    const currentUserPresence: PresenceStatus = connection.isConnected ? "online" : "offline";
    return users.map((user) =>
      user.id === currentUserId
        ? { ...user, status: currentUserPresence }
        : user,
    );
  }, [connection.isConnected, users, currentUserId]);

  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === selectedRoom.id),
    [messages, selectedRoom.id],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  return (
    <main className="app-shell">
      <WorkspaceHeader
        currentRoom={selectedRoom}
        users={usersWithConnection}
        connection={connection}
        currentUserName={user.name}
        unreadNotificationCount={unreadNotificationCount}
        onLogout={logout}
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
        notifications={notifications}
        onSelectRoom={setSelectedRoomId}
        onSendMessage={handleSendMessage}
        onReconnect={handleReconnect}
        onCreateCard={handleCreateCard}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
        onMarkNotificationRead={handleMarkNotificationRead}
      />
    </main>
  );
}

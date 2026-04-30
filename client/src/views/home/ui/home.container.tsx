"use client";

import { useMemo, useState } from "react";
import type { Notification } from "@/entities/notification";
import type { PresenceStatus } from "@/entities/user";
import { boardColumns, upcomingItems } from "@/shared/lib";
import { useSocket } from "@/shared/socket";
import { useAuth } from "@/features/auth";
import { MainDashboard } from "@/widgets/main-dashboard";
import { WorkspaceHeader } from "@/widgets/workspace-header";
import { useHomeSocket } from "../model/useHomeSocket";
import { useHomeActions } from "../model/useHomeActions";
import { useNotificationActions } from "../model/useNotificationActions";
import { useInitialData } from "../model/useInitialData";

export function HomeContainer() {
  const { user, logout } = useAuth();
  if (!user) {
    throw new Error("HomeContainer는 로그인된 상태에서만 렌더링되어야 합니다.");
  }
  const currentUserId = user.userId;

  const {
    rooms,
    users,
    messages,
    cards,
    isLoading,
    selectedRoomId,
    setSelectedRoomId,
    setMessages,
    setCards,
    setUsers,
  } = useInitialData(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket, connection } = useSocket();

  const effectiveRoomId = selectedRoomId ?? rooms[0]?.id ?? "";

  const { emitMain, emitBoard, emitChat } = useHomeSocket({
    currentUserId,
    selectedRoomId: effectiveRoomId,
    isConnected: connection.isConnected && Boolean(effectiveRoomId),
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
    selectedRoomId: effectiveRoomId,
    currentUserId,
    cards,
  });

  const { handleMarkNotificationRead } = useNotificationActions({
    emitAck: emitMain,
    setNotifications,
  });

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === effectiveRoomId) ?? rooms[0],
    [rooms, effectiveRoomId],
  );

  const usersWithConnection = useMemo(() => {
    const currentUserPresence: PresenceStatus = connection.isConnected ? "online" : "offline";
    return users.map((u) =>
      u.id === currentUserId ? { ...u, status: currentUserPresence } : u,
    );
  }, [connection.isConnected, users, currentUserId]);

  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === effectiveRoomId),
    [messages, effectiveRoomId],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  if (isLoading || !selectedRoom) {
    return (
      <div className="login-shell">
        <p className="muted">데이터를 불러오는 중...</p>
      </div>
    );
  }

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
        rooms={rooms}
        selectedRoomId={effectiveRoomId}
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

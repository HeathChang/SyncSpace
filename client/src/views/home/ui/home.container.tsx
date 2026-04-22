"use client";

import { useMemo, useState } from "react";
import type { BoardCard } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
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
import { MainDashboard } from "@/widgets/main-dashboard";
import { WorkspaceHeader } from "@/widgets/workspace-header";
import { useHomeSocket } from "../model/useHomeSocket";
import { useHomeActions } from "../model/useHomeActions";

const CURRENT_USER_ID = "u2";

export function HomeContainer() {
  const [selectedRoomId, setSelectedRoomId] = useState(mockRooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [cards, setCards] = useState<BoardCard[]>(mockBoardCards);
  const [users, setUsers] = useState<WorkspaceUser[]>(mockUsers);
  const { socket, connection } = useSocket();

  const { emitAck } = useHomeSocket({
    currentUserId: CURRENT_USER_ID,
    selectedRoomId,
    isConnected: connection.isConnected,
    users,
    setMessages,
    setCards,
    setUsers,
  });

  const {
    handleSendMessage,
    handleReconnect,
    handleMoveCard,
    handleDeleteCard,
    handleCreateCard,
  } = useHomeActions({
    socket,
    emitAck,
    selectedRoomId,
    currentUserId: CURRENT_USER_ID,
    cards,
  });

  const selectedRoom = useMemo(
    () => mockRooms.find((room) => room.id === selectedRoomId) ?? mockRooms[0],
    [selectedRoomId],
  );

  const usersWithConnection = useMemo(() => {
    const currentUserPresence: PresenceStatus = connection.isConnected ? "online" : "offline";
    return users.map((user) =>
      user.id === CURRENT_USER_ID
        ? { ...user, status: currentUserPresence }
        : user,
    );
  }, [connection.isConnected, users]);

  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === selectedRoom.id),
    [messages, selectedRoom.id],
  );

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

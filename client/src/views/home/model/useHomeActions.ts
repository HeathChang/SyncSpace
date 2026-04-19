"use client";

import { useCallback } from "react";
import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { Socket } from "socket.io-client";
import { eClientToServerEvents } from "@/shared/socket";

interface UseHomeActionsOptions {
  socket: Socket;
  emit: (event: string, payload: unknown) => void;
  selectedRoomId: string;
  currentUserId: string;
  cards: BoardCard[];
}

const getNextColumn = (column: BoardColumnId): BoardColumnId => {
  if (column === "todo") return "inProgress";
  if (column === "inProgress") return "done";
  return "todo";
};

export const useHomeActions = ({
  socket,
  emit,
  selectedRoomId,
  currentUserId,
  cards,
}: UseHomeActionsOptions) => {
  const handleSendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      emit(eClientToServerEvents.MESSAGE_SEND, {
        roomId: selectedRoomId,
        message: trimmed,
      });
    },
    [emit, selectedRoomId],
  );

  const handleReconnect = useCallback(() => {
    if (socket.connected) socket.disconnect();
    socket.connect();
  }, [socket]);

  const handleMoveCard = useCallback(
    (cardId: string) => {
      const card = cards.find((item) => item.id === cardId);
      if (!card) return;

      emit(eClientToServerEvents.BOARD_MOVE, {
        roomId: selectedRoomId,
        cardId,
        toColumn: getNextColumn(card.column),
      });
    },
    [cards, emit, selectedRoomId],
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      emit(eClientToServerEvents.BOARD_DELETE, { roomId: selectedRoomId, cardId });
    },
    [emit, selectedRoomId],
  );

  const handleCreateCard = useCallback(() => {
    emit(eClientToServerEvents.BOARD_CREATE, {
      roomId: selectedRoomId,
      cardId: crypto.randomUUID(),
      title: `신규 작업 ${cards.length + 1}`,
      assigneeId: currentUserId,
      tags: ["신규"],
    });
  }, [emit, selectedRoomId, currentUserId, cards.length]);

  return {
    handleSendMessage,
    handleReconnect,
    handleMoveCard,
    handleDeleteCard,
    handleCreateCard,
  };
};

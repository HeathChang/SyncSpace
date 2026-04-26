"use client";

import { useCallback } from "react";
import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { Socket } from "socket.io-client";
import { eClientToServerEvents } from "@/shared/socket";
import type { EventAck } from "@/shared/socket";
import { logger } from "@/shared/lib";

interface UseHomeActionsOptions {
  socket: Socket;
  emitChat: <TData = unknown>(
    event: string,
    payload: Record<string, unknown>,
  ) => Promise<EventAck<TData>>;
  emitBoard: <TData = unknown>(
    event: string,
    payload: Record<string, unknown>,
  ) => Promise<EventAck<TData>>;
  selectedRoomId: string;
  currentUserId: string;
  cards: BoardCard[];
}

const getNextColumn = (column: BoardColumnId): BoardColumnId => {
  if (column === "todo") return "inProgress";
  if (column === "inProgress") return "done";
  return "todo";
};

const warnOnFailure = (eventName: string, ack: EventAck<unknown>) => {
  if (!ack.ok) {
    logger.warn(`${eventName} failed`, ack.error);
  }
};

export const useHomeActions = ({
  socket,
  emitChat,
  emitBoard,
  selectedRoomId,
  currentUserId,
  cards,
}: UseHomeActionsOptions) => {
  const handleSendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      void emitChat(eClientToServerEvents.MESSAGE_SEND, {
        roomId: selectedRoomId,
        message: trimmed,
      }).then((ack) => warnOnFailure("MESSAGE_SEND", ack));
    },
    [emitChat, selectedRoomId],
  );

  const handleReconnect = useCallback(() => {
    if (socket.connected) socket.disconnect();
    socket.connect();
  }, [socket]);

  const handleMoveCard = useCallback(
    (cardId: string) => {
      const card = cards.find((item) => item.id === cardId);
      if (!card) return;

      void emitBoard(eClientToServerEvents.BOARD_MOVE, {
        roomId: selectedRoomId,
        cardId,
        toColumn: getNextColumn(card.column),
      }).then((ack) => warnOnFailure("BOARD_MOVE", ack));
    },
    [cards, emitBoard, selectedRoomId],
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      void emitBoard(eClientToServerEvents.BOARD_DELETE, {
        roomId: selectedRoomId,
        cardId,
      }).then((ack) => warnOnFailure("BOARD_DELETE", ack));
    },
    [emitBoard, selectedRoomId],
  );

  const handleCreateCard = useCallback(() => {
    void emitBoard(eClientToServerEvents.BOARD_CREATE, {
      roomId: selectedRoomId,
      cardId: crypto.randomUUID(),
      title: `신규 작업 ${cards.length + 1}`,
      assigneeId: currentUserId,
      tags: ["신규"],
    }).then((ack) => warnOnFailure("BOARD_CREATE", ack));
  }, [emitBoard, selectedRoomId, currentUserId, cards.length]);

  return {
    handleSendMessage,
    handleReconnect,
    handleMoveCard,
    handleDeleteCard,
    handleCreateCard,
  };
};

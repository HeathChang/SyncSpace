"use client";

import { useCallback } from "react";
import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { Socket } from "socket.io-client";
import { eClientToServerEvents } from "@/shared/socket";
import type { EventAck } from "@/shared/socket";
import { logger } from "@/shared/lib";

interface UseHomeActionsOptions {
  socket: Socket;
  emitAck: <TData = unknown>(
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
  emitAck,
  selectedRoomId,
  currentUserId,
  cards,
}: UseHomeActionsOptions) => {
  const handleSendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      void emitAck(eClientToServerEvents.MESSAGE_SEND, {
        roomId: selectedRoomId,
        message: trimmed,
      }).then((ack) => warnOnFailure("MESSAGE_SEND", ack));
    },
    [emitAck, selectedRoomId],
  );

  const handleReconnect = useCallback(() => {
    if (socket.connected) socket.disconnect();
    socket.connect();
  }, [socket]);

  const handleMoveCard = useCallback(
    (cardId: string) => {
      const card = cards.find((item) => item.id === cardId);
      if (!card) return;

      void emitAck(eClientToServerEvents.BOARD_MOVE, {
        roomId: selectedRoomId,
        cardId,
        toColumn: getNextColumn(card.column),
      }).then((ack) => warnOnFailure("BOARD_MOVE", ack));
    },
    [cards, emitAck, selectedRoomId],
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      void emitAck(eClientToServerEvents.BOARD_DELETE, {
        roomId: selectedRoomId,
        cardId,
      }).then((ack) => warnOnFailure("BOARD_DELETE", ack));
    },
    [emitAck, selectedRoomId],
  );

  const handleCreateCard = useCallback(() => {
    void emitAck(eClientToServerEvents.BOARD_CREATE, {
      roomId: selectedRoomId,
      cardId: crypto.randomUUID(),
      title: `신규 작업 ${cards.length + 1}`,
      assigneeId: currentUserId,
      tags: ["신규"],
    }).then((ack) => warnOnFailure("BOARD_CREATE", ack));
  }, [emitAck, selectedRoomId, currentUserId, cards.length]);

  return {
    handleSendMessage,
    handleReconnect,
    handleMoveCard,
    handleDeleteCard,
    handleCreateCard,
  };
};

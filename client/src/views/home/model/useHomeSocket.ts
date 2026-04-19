"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BoardCard } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { PresenceStatus, WorkspaceUser } from "@/entities/user";
import {
  useSocketEvent,
  useSocketEmit,
  useQueueStack,
  eClientToServerEvents,
  eServerToClientEvents,
} from "@/shared/socket";
import {
  hasUserId,
  hasMessagePayload,
  hasPresenceSnapshotPayload,
  hasBoardUpdatedPayload,
  formatMessageTime,
} from "@/shared/lib/socket-type-guards";
import type { MessagePayload } from "@/shared/lib/socket-type-guards";

const ACTIVE_NOW_TEXT = "방금 전";

interface UseHomeSocketOptions {
  currentUserId: string;
  selectedRoomId: string;
  isConnected: boolean;
  users: WorkspaceUser[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setCards: React.Dispatch<React.SetStateAction<BoardCard[]>>;
  setUsers: React.Dispatch<React.SetStateAction<WorkspaceUser[]>>;
}

export const useHomeSocket = ({
  currentUserId,
  selectedRoomId,
  isConnected,
  users,
  setMessages,
  setCards,
  setUsers,
}: UseHomeSocketOptions) => {
  const { emit } = useSocketEmit();
  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const processQueuedMessage = useCallback(
    (nextMessage: MessagePayload) => {
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
    },
    [setMessages],
  );

  const { enqueue } = useQueueStack<MessagePayload>({
    onDequeue: processQueuedMessage,
    intervalMs: 300,
  });

  const setUserStatus = useCallback(
    (userId: string, status: PresenceStatus) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, status, lastActiveAt: ACTIVE_NOW_TEXT }
            : user,
        ),
      );
    },
    [setUsers],
  );

  const handleUserOnline = useCallback(
    (payload: unknown) => {
      if (!hasUserId(payload)) return;
      setUserStatus(payload.userId, "online");
    },
    [setUserStatus],
  );

  const handleUserOffline = useCallback(
    (payload: unknown) => {
      if (!hasUserId(payload)) return;
      setUserStatus(payload.userId, "offline");
    },
    [setUserStatus],
  );

  const handleMessageNew = useCallback(
    (payload: unknown) => {
      if (!hasMessagePayload(payload)) return;
      enqueue(payload);
    },
    [enqueue],
  );

  const handlePresenceSnapshot = useCallback(
    (payload: unknown) => {
      if (!hasPresenceSnapshotPayload(payload)) return;

      const onlineUserIds = new Set(payload.userIds);
      setUsers((prev) =>
        prev.map((user) =>
          onlineUserIds.has(user.id)
            ? { ...user, status: "online", lastActiveAt: ACTIVE_NOW_TEXT }
            : { ...user, status: "offline" },
        ),
      );
    },
    [setUsers],
  );

  const handleBoardUpdated = useCallback(
    (payload: unknown) => {
      if (!hasBoardUpdatedPayload(payload) || payload.roomId !== selectedRoomId) return;

      setCards((prev) => {
        if (payload.action === "create") {
          if (prev.some((card) => card.id === payload.card.id)) return prev;
          return [...prev, payload.card];
        }

        if (payload.action === "move") {
          return prev.map((card) =>
            card.id === payload.cardId
              ? { ...card, column: payload.toColumn, updatedAt: payload.updatedAt }
              : card,
          );
        }

        return prev.filter((card) => card.id !== payload.cardId);
      });
    },
    [selectedRoomId, setCards],
  );

  useSocketEvent({ event: eServerToClientEvents.USER_ONLINE, handler: handleUserOnline });
  useSocketEvent({ event: eServerToClientEvents.USER_OFFLINE, handler: handleUserOffline });
  useSocketEvent({ event: eServerToClientEvents.PRESENCE_SNAPSHOT, handler: handlePresenceSnapshot });
  useSocketEvent({ event: eServerToClientEvents.MESSAGE_NEW, handler: handleMessageNew });
  useSocketEvent({ event: eServerToClientEvents.BOARD_UPDATED, handler: handleBoardUpdated });

  useEffect(() => {
    if (isConnected) {
      emit(eClientToServerEvents.USER_JOIN, { userId: currentUserId });
    }
  }, [isConnected, emit, currentUserId]);

  useEffect(() => {
    if (!isConnected) return;

    emit(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId });
    return () => {
      emit(eClientToServerEvents.ROOM_LEAVE, { roomId: selectedRoomId });
    };
  }, [isConnected, selectedRoomId, emit]);

  return { emit };
};

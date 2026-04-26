"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BoardCard } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { Notification } from "@/entities/notification";
import type { PresenceStatus, WorkspaceUser } from "@/entities/user";
import {
  useSocketEvent,
  useSocketEmitAck,
  useSocketReconnect,
  useQueueStack,
  eClientToServerEvents,
  eServerToClientEvents,
  eNamespace,
} from "@/shared/socket";
import {
  hasUserId,
  hasMessagePayload,
  hasPresenceSnapshotPayload,
  hasBoardUpdatedPayload,
  hasNotification,
  hasNotificationSnapshot,
  formatMessageTime,
  logger,
} from "@/shared/lib";
import type { MessagePayload } from "@/shared/lib";

const ACTIVE_NOW_TEXT = "방금 전";

interface UseHomeSocketOptions {
  currentUserId: string;
  selectedRoomId: string;
  isConnected: boolean;
  users: WorkspaceUser[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setCards: React.Dispatch<React.SetStateAction<BoardCard[]>>;
  setUsers: React.Dispatch<React.SetStateAction<WorkspaceUser[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const useHomeSocket = ({
  currentUserId,
  selectedRoomId,
  isConnected,
  users,
  setMessages,
  setCards,
  setUsers,
  setNotifications,
}: UseHomeSocketOptions) => {
  const { emitAck: emitMain } = useSocketEmitAck();
  const { emitAck: emitBoard } = useSocketEmitAck({ namespace: eNamespace.board });
  const { emitAck: emitChat } = useSocketEmitAck({ namespace: eNamespace.chat });

  const usersRef = useRef(users);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const processQueuedMessage = useCallback(
    (nextMessage: MessagePayload) => {
      const dedupKey = `${nextMessage.roomId}:${nextMessage.userId}:${nextMessage.timestamp}:${nextMessage.message}`;
      if (processedMessageIdsRef.current.has(dedupKey)) return;
      processedMessageIdsRef.current.add(dedupKey);

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

  const handleNotificationNew = useCallback(
    (payload: unknown) => {
      if (!hasNotification(payload)) return;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    },
    [setNotifications],
  );

  const handleNotificationSnapshot = useCallback(
    (payload: unknown) => {
      if (!hasNotificationSnapshot(payload)) return;
      setNotifications(payload.notifications);
    },
    [setNotifications],
  );

  // 메인 namespace
  useSocketEvent({ event: eServerToClientEvents.USER_ONLINE, handler: handleUserOnline });
  useSocketEvent({ event: eServerToClientEvents.USER_OFFLINE, handler: handleUserOffline });
  useSocketEvent({
    event: eServerToClientEvents.PRESENCE_SNAPSHOT,
    handler: handlePresenceSnapshot,
  });
  useSocketEvent({
    event: eServerToClientEvents.NOTIFICATION_NEW,
    handler: handleNotificationNew,
  });
  useSocketEvent({
    event: eServerToClientEvents.NOTIFICATION_SNAPSHOT,
    handler: handleNotificationSnapshot,
  });

  // /chat namespace
  useSocketEvent({
    event: eServerToClientEvents.MESSAGE_NEW,
    handler: handleMessageNew,
    namespace: eNamespace.chat,
  });

  // /board namespace
  useSocketEvent({
    event: eServerToClientEvents.BOARD_UPDATED,
    handler: handleBoardUpdated,
    namespace: eNamespace.board,
  });

  useEffect(() => {
    if (!isConnected) return;
    void emitMain(eClientToServerEvents.USER_JOIN, {}).then((ack) => {
      if (!ack.ok) logger.warn("USER_JOIN failed", ack.error);
    });
  }, [isConnected, emitMain]);

  useEffect(() => {
    if (!isConnected) return;
    void emitChat(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId }).then((ack) => {
      if (!ack.ok) logger.warn("/chat ROOM_JOIN failed", ack.error);
    });
    void emitBoard(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId }).then((ack) => {
      if (!ack.ok) logger.warn("/board ROOM_JOIN failed", ack.error);
    });
    return () => {
      void emitChat(eClientToServerEvents.ROOM_LEAVE, { roomId: selectedRoomId });
      void emitBoard(eClientToServerEvents.ROOM_LEAVE, { roomId: selectedRoomId });
    };
  }, [isConnected, selectedRoomId, emitChat, emitBoard]);

  useSocketReconnect(
    useCallback(() => {
      processedMessageIdsRef.current.clear();
      void emitMain(eClientToServerEvents.USER_JOIN, {});
      void emitChat(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId });
      void emitBoard(eClientToServerEvents.ROOM_JOIN, { roomId: selectedRoomId });
    }, [emitMain, emitChat, emitBoard, selectedRoomId]),
  );

  void currentUserId;

  return { emitMain, emitBoard, emitChat };
};

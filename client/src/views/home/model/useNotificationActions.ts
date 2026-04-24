"use client";

import { useCallback } from "react";
import type { Notification } from "@/entities/notification";
import { eClientToServerEvents } from "@/shared/socket";
import type { EventAck } from "@/shared/socket";
import { logger } from "@/shared/lib";

interface UseNotificationActionsOptions {
  emitAck: <TData = unknown>(
    event: string,
    payload: Record<string, unknown>,
  ) => Promise<EventAck<TData>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const useNotificationActions = ({
  emitAck,
  setNotifications,
}: UseNotificationActionsOptions) => {
  const handleMarkNotificationRead = useCallback(
    (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId && !item.readAt
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );

      void emitAck(eClientToServerEvents.NOTIFICATION_READ, { notificationId }).then((ack) => {
        if (!ack.ok) {
          logger.warn("NOTIFICATION_READ failed", ack.error);
          // Rollback on failure
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notificationId ? { ...item, readAt: undefined } : item,
            ),
          );
        }
      });
    },
    [emitAck, setNotifications],
  );

  return { handleMarkNotificationRead };
};

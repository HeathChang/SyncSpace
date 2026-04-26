import type { Server } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { AckCallback, RequestEnvelope } from "../socket.envelope";
import { eErrorCode } from "../socket.envelope";
import { DedupStore } from "../dedup-store";
import { NotificationStore } from "../notification/notification-store";
import { logger } from "../logger";

interface InstallMainOptions {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: DedupStore;
    notificationStore: NotificationStore;
    userRoom: (userId: string) => string;
}

export const installMainHandlers = ({
    io,
    dedupStore,
    notificationStore,
    userRoom,
}: InstallMainOptions): void => {
    const userToSocketIds = new Map<string, Set<string>>();
    const socketToUserId = new Map<string, string>();

    const addUserSocket = (userId: string, socketId: string) => {
        const socketIds = userToSocketIds.get(userId) ?? new Set<string>();
        const wasOnline = socketIds.size > 0;
        socketIds.add(socketId);
        userToSocketIds.set(userId, socketIds);
        socketToUserId.set(socketId, userId);
        return { wasOnline };
    };

    const removeUserSocket = (socketId: string) => {
        const userId = socketToUserId.get(socketId);
        if (!userId) return { userId: undefined, isNowOffline: false };

        socketToUserId.delete(socketId);
        const socketIds = userToSocketIds.get(userId);
        if (!socketIds) return { userId, isNowOffline: false };

        socketIds.delete(socketId);
        if (socketIds.size > 0) return { userId, isNowOffline: false };

        userToSocketIds.delete(userId);
        return { userId, isNowOffline: true };
    };

    const getOnlineUserIds = () => [...userToSocketIds.keys()];

    io.on("connection", (socket) => {
        const authenticatedUserId = socket.data.userId as string;
        logger.info(
            { socketId: socket.id, userId: authenticatedUserId, ns: "/" },
            "main namespace connected",
        );

        socket.join(userRoom(authenticatedUserId));

        const checkDedup = <TPayload, TAckData>(
            payload: RequestEnvelope<TPayload>,
            ack: AckCallback<TAckData>,
        ): boolean => {
            if (!payload?.requestId) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "requestId is required" },
                });
                return false;
            }
            if (dedupStore.isDuplicate(socket.id, payload.requestId)) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.DUPLICATE_REQUEST, message: "duplicate request" },
                });
                return false;
            }
            dedupStore.register(socket.id, payload.requestId);
            return true;
        };

        socket.on(eClientToServerEvents.USER_JOIN, (payload, ack) => {
            if (!checkDedup(payload, ack)) return;

            const userId = authenticatedUserId;
            const userName = (socket.data.userName as string | undefined) ?? userId;

            const previousUserId = socketToUserId.get(socket.id);
            if (previousUserId && previousUserId !== userId) {
                const previousUser = removeUserSocket(socket.id);
                if (previousUser.userId && previousUser.isNowOffline) {
                    socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                        userId: previousUser.userId,
                    });
                }
            }

            const { wasOnline } = addUserSocket(userId, socket.id);

            if (!wasOnline) {
                socket.broadcast.emit(eServerToClientEvents.USER_ONLINE, { userId });
            }

            const onlineUserIds = getOnlineUserIds();
            socket.emit(eServerToClientEvents.PRESENCE_SNAPSHOT, { userIds: onlineUserIds });

            const notifications = notificationStore.listForUser(userId);
            socket.emit(eServerToClientEvents.NOTIFICATION_SNAPSHOT, {
                notifications,
                unreadCount: notificationStore.unreadCount(userId),
            });

            ack({ ok: true, data: { userIds: onlineUserIds, userId, name: userName } });
        });

        socket.on(eClientToServerEvents.NOTIFICATION_READ, (payload, ack) => {
            if (!checkDedup(payload, ack)) return;
            const { notificationId } = payload;
            if (!notificationId) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "notificationId is required" },
                });
                return;
            }
            const ok = notificationStore.markRead(authenticatedUserId, notificationId);
            if (!ok) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "notification not found" },
                });
                return;
            }
            ack({ ok: true, data: undefined });
        });

        socket.on("disconnect", () => {
            const removed = removeUserSocket(socket.id);
            dedupStore.remove(socket.id);
            logger.info({ socketId: socket.id, userId: authenticatedUserId }, "main namespace disconnected");

            if (removed.userId && removed.isNowOffline) {
                socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                    userId: removed.userId,
                });
            }
        });
    });
};

import type { Server } from "socket.io";
import { eClientToServerEvents, eServerToClientEvents } from "../socket.types";
import type { ClientToServerEvents, ServerToClientEvents } from "../socket.types";
import type { IDedupStore } from "../storage/dedup-interface";
import { NotificationStore } from "../notification/notification-store";
import { logger } from "../logger";
import { validateAndDedup } from "./handler-utils";
import { userJoinSchema, notificationReadSchema } from "../schemas/event-schemas";
import { z } from "zod";
import { eErrorCode } from "../socket.envelope";

const userJoinEnvelope = userJoinSchema.extend({ requestId: z.string().min(1) });
const notificationReadEnvelope = notificationReadSchema.extend({
    requestId: z.string().min(1),
});

interface InstallMainOptions {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    dedupStore: IDedupStore;
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

        socket.on(eClientToServerEvents.USER_JOIN, async (rawPayload, ack) => {
            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                userJoinEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

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

            const notifications = await notificationStore.listForUser(userId);
            const unreadCount = await notificationStore.unreadCount(userId);
            socket.emit(eServerToClientEvents.NOTIFICATION_SNAPSHOT, {
                notifications,
                unreadCount,
            });

            ack({ ok: true, data: { userIds: onlineUserIds, userId, name: userName } });
        });

        socket.on(eClientToServerEvents.NOTIFICATION_READ, async (rawPayload, ack) => {
            const validated = await validateAndDedup(
                socket.id,
                rawPayload,
                notificationReadEnvelope,
                ack,
                dedupStore,
            );
            if (!validated) return;

            const ok = await notificationStore.markRead(
                authenticatedUserId,
                validated.notificationId,
            );
            if (!ok) {
                ack({
                    ok: false,
                    error: { code: eErrorCode.INVALID_INPUT, message: "notification not found" },
                });
                return;
            }
            ack({ ok: true, data: undefined });
        });

        socket.on("disconnect", async () => {
            const removed = removeUserSocket(socket.id);
            await dedupStore.remove(socket.id);
            logger.info(
                { socketId: socket.id, userId: authenticatedUserId },
                "main namespace disconnected",
            );

            if (removed.userId && removed.isNowOffline) {
                socket.broadcast.emit(eServerToClientEvents.USER_OFFLINE, {
                    userId: removed.userId,
                });
            }
        });
    });
};

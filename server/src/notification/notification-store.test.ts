/**
 * NotificationStore는 Prisma 의존이라 단위 테스트에서는 jest mock으로 격리.
 * 실제 DB 동작은 별도 e2e/integration 테스트로 검증.
 */

const createMock = jest.fn();
const findManyMock = jest.fn();
const findUniqueMock = jest.fn();
const updateMock = jest.fn();
const countMock = jest.fn();

jest.mock("../db/prisma", () => ({
    prisma: {
        notification: {
            create: (...args: unknown[]) => createMock(...args),
            findMany: (...args: unknown[]) => findManyMock(...args),
            findUnique: (...args: unknown[]) => findUniqueMock(...args),
            update: (...args: unknown[]) => updateMock(...args),
            count: (...args: unknown[]) => countMock(...args),
        },
    },
}));

import { NotificationStore } from "./notification-store";

describe("NotificationStore", () => {
    beforeEach(() => {
        createMock.mockReset();
        findManyMock.mockReset();
        findUniqueMock.mockReset();
        updateMock.mockReset();
        countMock.mockReset();
    });

    describe("create", () => {
        it("should serialize meta as JSON and return record", async () => {
            createMock.mockResolvedValue({
                id: "n1",
                userId: "u1",
                kind: "board:assigned",
                title: "t",
                body: "b",
                meta: '{"roomId":"r1"}',
                createdAt: new Date("2026-04-28T00:00:00Z"),
                readAt: null,
            });

            const store = new NotificationStore();
            const result = await store.create({
                userId: "u1",
                kind: "board:assigned",
                title: "t",
                body: "b",
                meta: { roomId: "r1" },
            });

            expect(createMock).toHaveBeenCalledWith({
                data: {
                    userId: "u1",
                    kind: "board:assigned",
                    title: "t",
                    body: "b",
                    meta: '{"roomId":"r1"}',
                },
            });
            expect(result.id).toBe("n1");
            expect(result.meta).toEqual({ roomId: "r1" });
            expect(result.readAt).toBeUndefined();
        });

        it("should accept missing meta", async () => {
            createMock.mockResolvedValue({
                id: "n1",
                userId: "u1",
                kind: "system:info",
                title: "t",
                body: "b",
                meta: null,
                createdAt: new Date(),
                readAt: null,
            });

            const store = new NotificationStore();
            const result = await store.create({
                userId: "u1",
                kind: "system:info",
                title: "t",
                body: "b",
            });

            expect(result.meta).toBeUndefined();
        });
    });

    describe("markRead", () => {
        it("should mark unread notification as read", async () => {
            findUniqueMock.mockResolvedValue({
                id: "n1",
                userId: "u1",
                readAt: null,
            });
            updateMock.mockResolvedValue({});

            const store = new NotificationStore();
            expect(await store.markRead("u1", "n1")).toBe(true);
            expect(updateMock).toHaveBeenCalledWith({
                where: { id: "n1" },
                data: { readAt: expect.any(Date) },
            });
        });

        it("should return false when notification not found", async () => {
            findUniqueMock.mockResolvedValue(null);
            const store = new NotificationStore();
            expect(await store.markRead("u1", "missing")).toBe(false);
        });

        it("should return false when already read", async () => {
            findUniqueMock.mockResolvedValue({
                id: "n1",
                userId: "u1",
                readAt: new Date(),
            });
            const store = new NotificationStore();
            expect(await store.markRead("u1", "n1")).toBe(false);
        });

        it("should return false when notification belongs to other user", async () => {
            findUniqueMock.mockResolvedValue({
                id: "n1",
                userId: "u2",
                readAt: null,
            });
            const store = new NotificationStore();
            expect(await store.markRead("u1", "n1")).toBe(false);
        });
    });

    describe("unreadCount", () => {
        it("should query with readAt: null", async () => {
            countMock.mockResolvedValue(3);
            const store = new NotificationStore();
            expect(await store.unreadCount("u1")).toBe(3);
            expect(countMock).toHaveBeenCalledWith({
                where: { userId: "u1", readAt: null },
            });
        });
    });

    describe("listForUser", () => {
        it("should map prisma rows to records", async () => {
            findManyMock.mockResolvedValue([
                {
                    id: "n1",
                    userId: "u1",
                    kind: "system:info",
                    title: "t",
                    body: "b",
                    meta: null,
                    createdAt: new Date("2026-04-28T00:00:00Z"),
                    readAt: null,
                },
            ]);
            const store = new NotificationStore();
            const list = await store.listForUser("u1");
            expect(list.length).toBe(1);
            expect(list[0].id).toBe("n1");
        });
    });
});

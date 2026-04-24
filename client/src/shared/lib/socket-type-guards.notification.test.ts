import { hasNotification, hasNotificationSnapshot } from "./socket-type-guards";

describe("hasNotification", () => {
    const valid = {
        id: "n1",
        userId: "u1",
        kind: "board:assigned",
        title: "new card",
        body: "assigned to you",
        createdAt: "2026-04-21T10:00:00Z",
    };

    it("should accept a valid notification", () => {
        expect(hasNotification(valid)).toBe(true);
    });

    it("should accept kind system:info", () => {
        expect(hasNotification({ ...valid, kind: "system:info" })).toBe(true);
    });

    it("should reject invalid kind", () => {
        expect(hasNotification({ ...valid, kind: "unknown" })).toBe(false);
    });

    it("should reject when id is missing", () => {
        const { id: _id, ...rest } = valid;
        expect(hasNotification(rest)).toBe(false);
    });

    it("should reject null", () => {
        expect(hasNotification(null)).toBe(false);
    });
});

describe("hasNotificationSnapshot", () => {
    it("should accept valid snapshot", () => {
        const snapshot = {
            notifications: [
                {
                    id: "n1",
                    userId: "u1",
                    kind: "system:info",
                    title: "t",
                    body: "b",
                    createdAt: "2026-04-21T10:00:00Z",
                },
            ],
            unreadCount: 1,
        };
        expect(hasNotificationSnapshot(snapshot)).toBe(true);
    });

    it("should accept empty notifications", () => {
        expect(hasNotificationSnapshot({ notifications: [], unreadCount: 0 })).toBe(true);
    });

    it("should reject when notifications contains invalid item", () => {
        const snapshot = {
            notifications: [{ id: "n1" }],
            unreadCount: 1,
        };
        expect(hasNotificationSnapshot(snapshot)).toBe(false);
    });

    it("should reject when unreadCount is missing", () => {
        expect(hasNotificationSnapshot({ notifications: [] })).toBe(false);
    });
});

import { NotificationStore } from "./notification-store";

describe("NotificationStore", () => {
    describe("create", () => {
        it("should return a notification with generated id and timestamp", () => {
            const store = new NotificationStore();
            const result = store.create({
                userId: "u1",
                kind: "board:assigned",
                title: "할당",
                body: "카드가 할당되었습니다",
            });

            expect(result.id).toBeTruthy();
            expect(result.userId).toBe("u1");
            expect(result.createdAt).toBeTruthy();
            expect(result.readAt).toBeUndefined();
        });

        it("should store notification in user's list", () => {
            const store = new NotificationStore();
            store.create({
                userId: "u1",
                kind: "board:assigned",
                title: "t",
                body: "b",
            });

            expect(store.listForUser("u1")).toHaveLength(1);
            expect(store.listForUser("u2")).toHaveLength(0);
        });

        it("should cap at 100 per user and drop oldest", () => {
            const store = new NotificationStore();
            for (let index = 0; index < 105; index += 1) {
                store.create({
                    userId: "u1",
                    kind: "system:info",
                    title: `t-${index}`,
                    body: "b",
                });
            }
            expect(store.listForUser("u1")).toHaveLength(100);
        });
    });

    describe("markRead", () => {
        it("should mark an unread notification as read", () => {
            const store = new NotificationStore();
            const created = store.create({
                userId: "u1",
                kind: "system:info",
                title: "t",
                body: "b",
            });

            expect(store.markRead("u1", created.id)).toBe(true);
            const list = store.listForUser("u1");
            expect(list[0].readAt).toBeTruthy();
        });

        it("should return false when notification not found", () => {
            const store = new NotificationStore();
            expect(store.markRead("u1", "missing")).toBe(false);
        });

        it("should return false when already read", () => {
            const store = new NotificationStore();
            const created = store.create({
                userId: "u1",
                kind: "system:info",
                title: "t",
                body: "b",
            });
            store.markRead("u1", created.id);
            expect(store.markRead("u1", created.id)).toBe(false);
        });

        it("should isolate notifications by user", () => {
            const store = new NotificationStore();
            const created = store.create({
                userId: "u1",
                kind: "system:info",
                title: "t",
                body: "b",
            });
            expect(store.markRead("u2", created.id)).toBe(false);
        });
    });

    describe("unreadCount", () => {
        it("should count only unread items", () => {
            const store = new NotificationStore();
            const a = store.create({ userId: "u1", kind: "system:info", title: "t", body: "b" });
            store.create({ userId: "u1", kind: "system:info", title: "t", body: "b" });
            store.markRead("u1", a.id);
            expect(store.unreadCount("u1")).toBe(1);
        });

        it("should return 0 for unknown user", () => {
            const store = new NotificationStore();
            expect(store.unreadCount("u-unknown")).toBe(0);
        });
    });
});

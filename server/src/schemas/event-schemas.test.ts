import {
    boardCreateSchema,
    boardMoveSchema,
    messageSendSchema,
    formatZodError,
} from "./event-schemas";

describe("event schemas", () => {
    describe("messageSendSchema", () => {
        it("should accept valid payload and trim whitespace", () => {
            const result = messageSendSchema.parse({
                roomId: "room-1",
                message: "  hello  ",
            });
            expect(result.message).toBe("hello");
        });

        it("should reject empty message", () => {
            expect(() =>
                messageSendSchema.parse({ roomId: "room-1", message: "   " }),
            ).toThrow();
        });

        it("should reject message over max length", () => {
            const longMessage = "a".repeat(2001);
            expect(() =>
                messageSendSchema.parse({ roomId: "room-1", message: longMessage }),
            ).toThrow();
        });
    });

    describe("boardMoveSchema", () => {
        it("should accept valid columns", () => {
            const result = boardMoveSchema.parse({
                roomId: "room-1",
                cardId: "c-1",
                toColumn: "inProgress",
            });
            expect(result.toColumn).toBe("inProgress");
        });

        it("should reject invalid column", () => {
            expect(() =>
                boardMoveSchema.parse({
                    roomId: "room-1",
                    cardId: "c-1",
                    toColumn: "invalid",
                }),
            ).toThrow();
        });
    });

    describe("boardCreateSchema", () => {
        it("should reject when title is missing", () => {
            expect(() =>
                boardCreateSchema.parse({
                    roomId: "room-1",
                    cardId: "c-1",
                    title: "  ",
                    assigneeId: "u1",
                    tags: [],
                }),
            ).toThrow();
        });

        it("should accept up to 20 tags", () => {
            const tags = Array.from({ length: 20 }, (_, i) => `t${i}`);
            const result = boardCreateSchema.parse({
                roomId: "room-1",
                cardId: "c-1",
                title: "Title",
                assigneeId: "u1",
                tags,
            });
            expect(result.tags).toHaveLength(20);
        });

        it("should reject more than 20 tags", () => {
            const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
            expect(() =>
                boardCreateSchema.parse({
                    roomId: "room-1",
                    cardId: "c-1",
                    title: "Title",
                    assigneeId: "u1",
                    tags,
                }),
            ).toThrow();
        });
    });

    describe("formatZodError", () => {
        it("should format issues into a single string", () => {
            const result = messageSendSchema.safeParse({
                roomId: "",
                message: "",
            });
            if (result.success) throw new Error("expected failure");
            const formatted = formatZodError(result.error);
            expect(formatted).toContain("roomId");
            expect(formatted).toContain("message");
        });
    });
});

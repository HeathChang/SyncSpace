import {
  hasUserId,
  hasMessagePayload,
  hasPresenceSnapshotPayload,
  hasBoardUpdatedPayload,
  formatMessageTime,
} from "./socket-type-guards";

describe("hasUserId", () => {
  it("should return true for valid payload with userId", () => {
    expect(hasUserId({ userId: "u1" })).toBe(true);
  });

  it("should return false when userId is missing", () => {
    expect(hasUserId({})).toBe(false);
  });

  it("should return false when userId is not a string", () => {
    expect(hasUserId({ userId: 123 })).toBe(false);
  });

  it("should return false for null", () => {
    expect(hasUserId(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(hasUserId(undefined)).toBe(false);
  });

  it("should return false for primitive string", () => {
    expect(hasUserId("u1")).toBe(false);
  });
});

describe("hasMessagePayload", () => {
  const validPayload = {
    roomId: "room-1",
    userId: "u1",
    message: "hello",
    timestamp: "2026-04-17T10:00:00.000Z",
  };

  it("should return true for valid message payload", () => {
    expect(hasMessagePayload(validPayload)).toBe(true);
  });

  it("should return false when roomId is missing", () => {
    const { roomId: _roomId, ...rest } = validPayload;
    expect(hasMessagePayload(rest)).toBe(false);
  });

  it("should return false when message is not a string", () => {
    expect(hasMessagePayload({ ...validPayload, message: 123 })).toBe(false);
  });

  it("should return false when timestamp is missing", () => {
    const { timestamp: _timestamp, ...rest } = validPayload;
    expect(hasMessagePayload(rest)).toBe(false);
  });
});

describe("hasPresenceSnapshotPayload", () => {
  it("should return true for valid payload with userIds array of strings", () => {
    expect(hasPresenceSnapshotPayload({ userIds: ["u1", "u2"] })).toBe(true);
  });

  it("should return true for empty userIds array", () => {
    expect(hasPresenceSnapshotPayload({ userIds: [] })).toBe(true);
  });

  it("should return false when userIds contains non-string values", () => {
    expect(hasPresenceSnapshotPayload({ userIds: ["u1", 123] })).toBe(false);
  });

  it("should return false when userIds is not an array", () => {
    expect(hasPresenceSnapshotPayload({ userIds: "u1" })).toBe(false);
  });
});

describe("hasBoardUpdatedPayload", () => {
  describe("given action is create", () => {
    it("returns true for valid create payload", () => {
      const payload = {
        roomId: "room-1",
        action: "create",
        card: {
          id: "c1",
          title: "title",
          assigneeId: "u1",
          column: "todo",
          updatedAt: "방금 전",
          tags: ["tag1"],
        },
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(true);
    });

    it("returns false when column is invalid", () => {
      const payload = {
        roomId: "room-1",
        action: "create",
        card: {
          id: "c1",
          title: "title",
          assigneeId: "u1",
          column: "invalid-column",
          updatedAt: "방금 전",
          tags: [],
        },
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(false);
    });
  });

  describe("given action is move", () => {
    it("returns true for valid move payload", () => {
      const payload = {
        roomId: "room-1",
        action: "move",
        cardId: "c1",
        toColumn: "inProgress",
        updatedAt: "방금 전",
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(true);
    });

    it("returns false when toColumn is invalid", () => {
      const payload = {
        roomId: "room-1",
        action: "move",
        cardId: "c1",
        toColumn: "invalid",
        updatedAt: "방금 전",
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(false);
    });
  });

  describe("given action is delete", () => {
    it("returns true for valid delete payload", () => {
      const payload = {
        roomId: "room-1",
        action: "delete",
        cardId: "c1",
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(true);
    });

    it("returns false when cardId is missing", () => {
      const payload = {
        roomId: "room-1",
        action: "delete",
      };
      expect(hasBoardUpdatedPayload(payload)).toBe(false);
    });
  });

  it("should return false for unknown action", () => {
    const payload = { roomId: "room-1", action: "unknown" };
    expect(hasBoardUpdatedPayload(payload)).toBe(false);
  });
});

describe("formatMessageTime", () => {
  it("should format ISO timestamp to HH:mm in Korean locale", () => {
    const result = formatMessageTime("2026-04-17T10:30:00.000Z");
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should return '지금' for invalid timestamp", () => {
    expect(formatMessageTime("invalid-date")).toBe("지금");
  });

  it("should return '지금' for empty string", () => {
    expect(formatMessageTime("")).toBe("지금");
  });
});

import { prisma } from "../db/prisma";

export type BoardColumnId = "todo" | "inProgress" | "done";

export interface BoardCardRecord {
    id: string;
    roomId: string;
    title: string;
    assigneeId: string;
    column: BoardColumnId;
    tags: string[];
    updatedAt: Date;
}

interface CreateCardInput {
    id: string;
    roomId: string;
    title: string;
    assigneeId: string;
    tags: string[];
}

const decodeTags = (raw: string): string[] => {
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((t) => typeof t === "string")) {
            return parsed;
        }
    } catch {
        // fall through
    }
    return [];
};

const toRecord = (row: {
    id: string;
    roomId: string;
    title: string;
    assigneeId: string;
    column: string;
    tags: string;
    updatedAt: Date;
}): BoardCardRecord => ({
    id: row.id,
    roomId: row.roomId,
    title: row.title,
    assigneeId: row.assigneeId,
    column: row.column as BoardColumnId,
    tags: decodeTags(row.tags),
    updatedAt: row.updatedAt,
});

export const createCard = async (input: CreateCardInput): Promise<BoardCardRecord> => {
    const row = await prisma.boardCard.create({
        data: {
            id: input.id,
            roomId: input.roomId,
            title: input.title,
            assigneeId: input.assigneeId,
            column: "todo",
            tags: JSON.stringify(input.tags),
        },
    });
    return toRecord(row);
};

export const moveCard = async (
    cardId: string,
    toColumn: BoardColumnId,
): Promise<BoardCardRecord | null> => {
    try {
        const row = await prisma.boardCard.update({
            where: { id: cardId },
            data: { column: toColumn },
        });
        return toRecord(row);
    } catch {
        return null;
    }
};

export const deleteCard = async (cardId: string): Promise<boolean> => {
    try {
        await prisma.boardCard.delete({ where: { id: cardId } });
        return true;
    } catch {
        return false;
    }
};

export const listCardsByRoom = async (roomId: string): Promise<BoardCardRecord[]> => {
    const rows = await prisma.boardCard.findMany({
        where: { roomId },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toRecord);
};

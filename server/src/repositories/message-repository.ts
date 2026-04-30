import { prisma } from "../db/prisma";

export interface MessageRecord {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    createdAt: Date;
}

interface CreateMessageInput {
    roomId: string;
    userId: string;
    content: string;
}

export const createMessage = async (input: CreateMessageInput): Promise<MessageRecord> => {
    return prisma.message.create({ data: input });
};

export const listMessagesByRoom = async (
    roomId: string,
    limit = 50,
): Promise<MessageRecord[]> => {
    const rows = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
    return rows.reverse();
};

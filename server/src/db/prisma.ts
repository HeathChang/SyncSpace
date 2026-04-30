import { PrismaClient } from "@prisma/client";

/**
 * 단일 PrismaClient 인스턴스를 export.
 * - 핫리로드(ts-node-dev) 환경에서도 단일 connection 유지.
 */

declare global {
    // eslint-disable-next-line no-var
    var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient =
    globalThis.__prismaClient ??
    new PrismaClient({
        log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalThis.__prismaClient = prisma;
}

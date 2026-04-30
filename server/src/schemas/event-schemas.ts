import { z } from "zod";

/**
 * 모든 이벤트의 입력 스키마.
 * - RequestEnvelope의 requestId는 별도 dedup 미들웨어에서 검증.
 * - 페이로드 검증만 책임짐.
 */

export const userJoinSchema = z.object({}).passthrough();

export const messageSendSchema = z.object({
    roomId: z.string().min(1),
    message: z.string().trim().min(1).max(2000),
});

export const boardCreateSchema = z.object({
    roomId: z.string().min(1),
    cardId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    assigneeId: z.string().min(1),
    tags: z.array(z.string().max(50)).max(20),
});

export const boardMoveSchema = z.object({
    roomId: z.string().min(1),
    cardId: z.string().min(1),
    toColumn: z.enum(["todo", "inProgress", "done"]),
});

export const boardDeleteSchema = z.object({
    roomId: z.string().min(1),
    cardId: z.string().min(1),
});

export const cursorMoveSchema = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
});

export const roomReqSchema = z.object({
    roomId: z.string().min(1),
});

export const notificationReadSchema = z.object({
    notificationId: z.string().min(1),
});

export const requestEnvelopeBase = z.object({
    requestId: z.string().min(1),
});

/**
 * Zod 검증 결과를 ACK 친화 형태로 변환.
 */
export const formatZodError = (error: z.ZodError): string => {
    return error.issues
        .map((issue: z.core.$ZodIssue) => {
            const path = issue.path.join(".");
            return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("; ");
};

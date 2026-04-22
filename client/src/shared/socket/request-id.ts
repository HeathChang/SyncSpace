/**
 * 멱등성/중복 방지를 위해 각 요청에 부여하는 고유 ID.
 * 서버는 동일 requestId의 재수신을 DUPLICATE_REQUEST로 거부한다.
 */
export const createRequestId = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

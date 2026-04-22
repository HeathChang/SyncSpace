/**
 * 이벤트 공통 규약 (서버/클라이언트 공유)
 * - 모든 요청은 RequestEnvelope로 감싸 requestId를 포함한다.
 * - 모든 응답은 ACK 콜백으로 EventAck<T>를 반환한다.
 */

export enum eErrorCode {
    INVALID_INPUT = "INVALID_INPUT",
    ROOM_REQUIRED = "ROOM_REQUIRED",
    UNAUTHORIZED = "UNAUTHORIZED",
    DUPLICATE_REQUEST = "DUPLICATE_REQUEST",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface EventError {
    code: eErrorCode;
    message: string;
}

export type EventAck<TData = void> =
    | { ok: true; data: TData }
    | { ok: false; error: EventError };

export type RequestEnvelope<T> = T & { requestId: string };

export type AckCallback<TData = void> = (ack: EventAck<TData>) => void;

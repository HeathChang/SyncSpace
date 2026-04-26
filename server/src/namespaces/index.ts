/**
 * Socket.IO namespace 식별자.
 * - 같은 TCP 연결을 멀티플렉싱하여 도메인별로 분리.
 * - 각 namespace는 독립적 Room/이벤트 공간.
 */
export const eNamespace = {
    main: "/",
    chat: "/chat",
    board: "/board",
} as const;

export type Namespace = (typeof eNamespace)[keyof typeof eNamespace];

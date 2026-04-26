/**
 * Socket.IO namespace 식별자 (서버와 동기화).
 * - 클라이언트는 namespace별로 별도 socket 인스턴스를 갖되, 같은 TCP 연결을 공유.
 */
export const eNamespace = {
    main: "/",
    chat: "/chat",
    board: "/board",
} as const;

export type Namespace = (typeof eNamespace)[keyof typeof eNamespace];

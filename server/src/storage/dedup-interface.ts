/**
 * 중복 요청 방지 store 인터페이스.
 * - 단일 인스턴스: in-memory 구현
 * - 멀티 인스턴스: Redis 구현
 */
export interface IDedupStore {
    isDuplicate(socketId: string, requestId: string): Promise<boolean> | boolean;
    register(socketId: string, requestId: string): Promise<void> | void;
    remove(socketId: string): Promise<void> | void;
}

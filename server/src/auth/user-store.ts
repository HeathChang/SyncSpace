/**
 * 학습용 in-memory 유저 스토어.
 * 프로덕션에서는 DB + 해시된 비밀번호 + 브루트포스 방지가 필요.
 */

export interface MockUser {
    id: string;
    name: string;
    password: string; // dev-only 평문 (학습 목적)
}

const users: MockUser[] = [
    { id: "u1", name: "김민수", password: "password1" },
    { id: "u2", name: "박서연", password: "password2" },
    { id: "u3", name: "이도윤", password: "password3" },
    { id: "u4", name: "정하은", password: "password4" },
];

export const findUserByCredentials = (
    userId: string,
    password: string,
): MockUser | undefined => {
    return users.find((user) => user.id === userId && user.password === password);
};

export const findUserById = (userId: string): MockUser | undefined => {
    return users.find((user) => user.id === userId);
};

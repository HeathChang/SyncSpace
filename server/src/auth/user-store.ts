import { prisma } from "../db/prisma";
import { verifyPassword } from "./password";

export interface AuthenticatedUser {
    id: string;
    name: string;
}

export const findUserByCredentials = async (
    userId: string,
    password: string,
): Promise<AuthenticatedUser | undefined> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return undefined;

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return undefined;

    return { id: user.id, name: user.name };
};

export const findUserById = async (
    userId: string,
): Promise<AuthenticatedUser | undefined> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return undefined;
    return { id: user.id, name: user.name };
};

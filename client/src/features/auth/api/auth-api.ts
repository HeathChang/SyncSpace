"use client";

export interface AuthUser {
    userId: string;
    name: string;
}

const buildUrl = (path: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
    return `${base}${path}`;
};

interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}

export const loginRequest = async (
    userId: string,
    password: string,
): Promise<ApiResponse<AuthUser>> => {
    const res = await fetch(buildUrl("/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
    });

    return (await res.json()) as ApiResponse<AuthUser>;
};

export const logoutRequest = async (): Promise<void> => {
    await fetch(buildUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
    });
};

export const meRequest = async (): Promise<ApiResponse<AuthUser>> => {
    const res = await fetch(buildUrl("/auth/me"), {
        credentials: "include",
    });
    return (await res.json()) as ApiResponse<AuthUser>;
};

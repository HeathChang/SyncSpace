"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { ReactNode } from "react";
import { loginRequest, logoutRequest, meRequest } from "../api/auth-api";
import type { AuthUser } from "../api/auth-api";
import { logger } from "@/shared/lib";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (userId: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                const res = await meRequest();
                if (cancelled) return;
                if (res.ok && res.data) {
                    setUser(res.data);
                }
            } catch (error) {
                logger.warn("auth bootstrap failed", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (userId: string, password: string): Promise<boolean> => {
        const res = await loginRequest(userId, password);
        if (res.ok && res.data) {
            setUser(res.data);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(async () => {
        await logoutRequest();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, isLoading, login, logout }),
        [user, isLoading, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("AuthProvider가 필요합니다.");
    }
    return context;
}

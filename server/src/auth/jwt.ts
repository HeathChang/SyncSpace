import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: string;
    name: string;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "2h";

const resolveSecret = (): string => {
    const fromEnv = process.env.JWT_SECRET;
    if (fromEnv && fromEnv.length >= 32) {
        return fromEnv;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "JWT_SECRET must be set to a value of at least 32 characters in production",
        );
    }

    // dev/test 환경에서만 fallback 허용
    return "dev-only-secret-please-change-in-production-32-chars";
};

const JWT_SECRET = resolveSecret();

export const signAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        if (
            typeof decoded === "object" &&
            decoded !== null &&
            typeof decoded.userId === "string" &&
            typeof decoded.name === "string"
        ) {
            return { userId: decoded.userId, name: decoded.name };
        }
        return null;
    } catch {
        return null;
    }
};

export const AUTH_COOKIE_NAME = "syncspace_token";

import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: string;
    name: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "2h";

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

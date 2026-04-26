import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

/**
 * HTTP 요청 로깅 미들웨어.
 * - 메서드/경로/상태코드/처리시간 기록.
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();

    res.on("finish", () => {
        const elapsedMs = Date.now() - startedAt;
        logger.info(
            {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                elapsedMs,
            },
            "http request",
        );
    });

    next();
};

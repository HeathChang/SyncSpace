/**
 * 클라이언트 로거 래퍼.
 * - 추후 Sentry 등 실제 observability 툴로 교체 가능한 형태.
 * - base.md의 "console.log 직접 사용 금지" 규칙을 단일 진입점으로 우회.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
    level: LogLevel;
    message: string;
    meta?: unknown;
}

type LogSink = (entry: LogEntry) => void;

const isDev = process.env.NODE_ENV !== "production";

// eslint-disable-next-line no-console
const devSink: LogSink = ({ level, message, meta }) => {
    // 개발 환경에서만 브라우저 콘솔로 전달. 프로덕션에서는 noop.
    if (!isDev) return;
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    if (meta !== undefined) {
        fn(`[${level}]`, message, meta);
    } else {
        fn(`[${level}]`, message);
    }
};

let currentSink: LogSink = devSink;

export const setLogSink = (sink: LogSink): void => {
    currentSink = sink;
};

export const logger = {
    info: (message: string, meta?: unknown) => currentSink({ level: "info", message, meta }),
    warn: (message: string, meta?: unknown) => currentSink({ level: "warn", message, meta }),
    error: (message: string, meta?: unknown) => currentSink({ level: "error", message, meta }),
};

/**
 * 통합 로거
 *
 * - 프로덕션(NODE_ENV=production)에서는 warn, error만 출력
 * - 개발 환경에서는 모든 레벨 출력
 * - 각 로그에 타임스탬프 + context 접두사 포함
 * - 외부 라이브러리 없이 console 래핑
 * - 테스트에서 mock 가능하도록 named export
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

function formatPrefix(level: LogLevel, context?: string): string {
  const ts = formatTimestamp();
  const lvl = level.toUpperCase().padEnd(5);
  return context ? `[${ts}] ${lvl} [${context}]` : `[${ts}] ${lvl}`;
}

function shouldOutput(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "production") {
    return level === "warn" || level === "error";
  }
  return true;
}

function log(entry: LogEntry): void {
  if (!shouldOutput(entry.level)) return;

  const prefix = formatPrefix(entry.level, entry.context);
  const consoleFn = entry.level === "debug" || entry.level === "info"
    ? console.log
    : entry.level === "warn"
      ? console.warn
      : console.error;

  if (entry.data !== undefined) {
    consoleFn(prefix, entry.message, entry.data);
  } else {
    consoleFn(prefix, entry.message);
  }
}

const logger = {
  debug(message: string, context?: string, data?: unknown): void {
    log({ level: "debug", message, context, data });
  },

  info(message: string, context?: string, data?: unknown): void {
    log({ level: "info", message, context, data });
  },

  warn(message: string, context?: string, data?: unknown): void {
    log({ level: "warn", message, context, data });
  },

  error(message: string, context?: string, data?: unknown): void {
    log({ level: "error", message, context, data });
  },
};

export default logger;
export { logger };

/**
 * Structured logging service with levels, context, and production filtering.
 * In production, only warn/error are emitted. In dev, all levels are logged.
 */

import { IS_DEV } from "./config";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = IS_DEV ? "debug" : "warn";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? `[${entry.context}]` : "";
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${ctx} ${entry.message}`;
}

function emit(entry: LogEntry) {
  if (!shouldLog(entry.level)) return;

  const formatted = formatEntry(entry);
  const consoleFn =
    entry.level === "error"
      ? console.error
      : entry.level === "warn"
        ? console.warn
        : entry.level === "info"
          ? console.info
          : console.debug;

  if (entry.data !== undefined) {
    consoleFn(formatted, entry.data);
  } else {
    consoleFn(formatted);
  }
}

function createLogMethod(level: LogLevel) {
  return (message: string, data?: unknown, context?: string) => {
    emit({
      level,
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Create a logger scoped to a specific context (e.g. component or service name).
 */
export function createLogger(context: string) {
  return {
    debug: (msg: string, data?: unknown) => createLogMethod("debug")(msg, data, context),
    info: (msg: string, data?: unknown) => createLogMethod("info")(msg, data, context),
    warn: (msg: string, data?: unknown) => createLogMethod("warn")(msg, data, context),
    error: (msg: string, data?: unknown) => createLogMethod("error")(msg, data, context),
  };
}

/** Global logger instance */
export const logger = {
  debug: createLogMethod("debug"),
  info: createLogMethod("info"),
  warn: createLogMethod("warn"),
  error: createLogMethod("error"),
};

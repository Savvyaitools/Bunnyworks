/**
 * Core module barrel export.
 * Import from "@/core" for config, logging, errors, retry, and API utilities.
 */

export { config, ENV, IS_DEV, IS_PROD } from "./config";
export { logger, createLogger } from "./logger";
export { AppError, ErrorCode, normalizeError, getUserMessage } from "./errors";
export { withRetry } from "./retry";
export type { RetryOptions } from "./retry";
export { invokeFunction, queryTable } from "./api";
export { setupGlobalErrorHandlers } from "./globalErrorHandler";

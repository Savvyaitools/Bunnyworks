/**
 * Generic retry utility with exponential backoff and jitter.
 */

import { config } from "./config";
import { normalizeError, AppError } from "./errors";
import { createLogger } from "./logger";

const log = createLogger("retry");

export interface RetryOptions {
  /** Max number of retry attempts (default from config) */
  maxRetries?: number;
  /** Base delay in ms (default from config) */
  baseDelay?: number;
  /** Custom check: should we retry this error? Defaults to error.isRetryable */
  shouldRetry?: (error: AppError, attempt: number) => boolean;
  /** Called before each retry with the error and attempt number */
  onRetry?: (error: AppError, attempt: number) => void;
}

/**
 * Execute an async function with automatic retries on transient failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = config.api.maxRetries,
    baseDelay = config.api.retryBaseDelay,
    shouldRetry = (err) => err.isRetryable,
    onRetry,
  } = options;

  let lastError: AppError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (raw) {
      lastError = normalizeError(raw);

      if (attempt >= maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      log.warn(`Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`, {
        error: lastError.message,
        code: lastError.code,
      });

      onRetry?.(lastError, attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript: lastError is always assigned if we reach here
  throw lastError!;
}

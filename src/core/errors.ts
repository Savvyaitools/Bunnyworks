/**
 * Centralized error types and utilities for consistent error handling.
 */

export enum ErrorCode {
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  AUTH = "AUTH_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT = "RATE_LIMIT",
  SERVER = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly originalCause?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    options?: {
      statusCode?: number;
      isRetryable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    if (options?.cause) {
      this.cause = options.cause;
    }
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.isRetryable = options?.isRetryable ?? false;
    this.context = options?.context;
  }
}

/**
 * Normalize any thrown value into an AppError.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Supabase / PostgREST errors
    if (msg.includes("jwt") || msg.includes("unauthorized") || msg.includes("not authenticated")) {
      return new AppError(error.message, ErrorCode.AUTH, { statusCode: 401, cause: error });
    }
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return new AppError(error.message, ErrorCode.TIMEOUT, { isRetryable: true, cause: error });
    }
    if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network")) {
      return new AppError(error.message, ErrorCode.NETWORK, { isRetryable: true, cause: error });
    }
    if (msg.includes("rate limit") || msg.includes("429")) {
      return new AppError(error.message, ErrorCode.RATE_LIMIT, { statusCode: 429, isRetryable: true, cause: error });
    }

    return new AppError(error.message, ErrorCode.UNKNOWN, { cause: error });
  }

  return new AppError(String(error), ErrorCode.UNKNOWN);
}

/**
 * User-friendly message for display in toasts / UI.
 */
export function getUserMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCode.NETWORK:
      return "Connection error. Please check your internet and try again.";
    case ErrorCode.TIMEOUT:
      return "The request timed out. Please try again.";
    case ErrorCode.AUTH:
      return "Your session has expired. Please sign in again.";
    case ErrorCode.RATE_LIMIT:
      return "Too many requests. Please wait a moment and try again.";
    case ErrorCode.NOT_FOUND:
      return "The requested resource was not found.";
    case ErrorCode.VALIDATION:
      return error.message;
    case ErrorCode.SERVER:
      return "Something went wrong on our end. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

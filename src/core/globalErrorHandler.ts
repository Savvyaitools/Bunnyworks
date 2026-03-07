/**
 * Global error handler setup. Call once in main.tsx.
 * Catches unhandled promise rejections and uncaught errors.
 */

import { createLogger } from "@/core/logger";

const log = createLogger("GlobalErrorHandler");

export function setupGlobalErrorHandlers() {
  window.addEventListener("unhandledrejection", (event) => {
    log.error("Unhandled promise rejection", {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack,
    });
  });

  window.addEventListener("error", (event) => {
    log.error("Uncaught error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

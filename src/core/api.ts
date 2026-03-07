/**
 * Centralized API service for edge function calls with retry, timeout, and error normalization.
 */

import { supabase } from "@/integrations/supabase/client";
import { config } from "./config";
import { withRetry, RetryOptions } from "./retry";
import { normalizeError, AppError, ErrorCode } from "./errors";
import { createLogger } from "./logger";

const log = createLogger("api");

interface InvokeOptions {
  /** HTTP method (default POST) */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Request body */
  body?: Record<string, unknown>;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Timeout in ms (default from config) */
  timeout?: number;
  /** Retry options (default from config) */
  retry?: RetryOptions | false;
}

/**
 * Invoke a backend function with retry, timeout, and normalized error handling.
 */
export async function invokeFunction<T = unknown>(
  functionName: string,
  options: InvokeOptions = {}
): Promise<T> {
  const {
    method = "POST",
    body,
    headers,
    timeout = config.api.timeout,
    retry: retryOpts,
  } = options;

  const execute = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      log.debug(`Invoking ${functionName}`, { method, body });

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        method,
      });

      if (error) {
        throw new AppError(error.message || `Function ${functionName} failed`, ErrorCode.SERVER, {
          statusCode: 500,
          isRetryable: true,
          context: { functionName },
        });
      }

      return data as T;
    } catch (err) {
      if (err instanceof AppError) throw err;

      const normalized = normalizeError(err);
      if ((err as Error).name === "AbortError") {
        throw new AppError(`Function ${functionName} timed out after ${timeout}ms`, ErrorCode.TIMEOUT, {
          isRetryable: true,
          context: { functionName, timeout },
        });
      }
      throw normalized;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (retryOpts === false) {
    return execute();
  }

  return withRetry(execute, retryOpts);
}

/**
 * Typed wrapper for common data fetching patterns from the database.
 */
export async function queryTable<T>(
  table: string,
  options: {
    select?: string;
    filters?: { column: string; value: unknown }[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}
): Promise<T[]> {
  const { select = "*", filters, orderBy, limit = config.pagination.defaultPageSize } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from(table as any).select(select);

  if (filters) {
    for (const f of filters) {
      query = query.eq(f.column, f.value);
    }
  }

  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
  }

  if (limit > 0) {
    query = query.range(0, limit - 1);
  }

  const { data, error } = await query;
  if (error) throw normalizeError(error);
  return (data ?? []) as unknown as T[];
}

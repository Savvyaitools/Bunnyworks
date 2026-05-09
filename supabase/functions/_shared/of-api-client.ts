/**
 * OnlyFansAPI.com REST client.
 * All OnlyFans operations route through here so we have one
 * place for auth, retries, error shaping, and rate-limit handling.
 *
 * Docs: https://docs.onlyfansapi.com
 */

const BASE_URL = Deno.env.get("ONLYFANSAPI_BASE_URL") ?? "https://app.onlyfansapi.com/api";

export class OfApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "OfApiError";
  }
}

function getApiKey(): string {
  const key = Deno.env.get("ONLYFANS_API_KEY");
  if (!key) throw new OfApiError("ONLYFANS_API_KEY is not configured", 500);
  return key;
}

export interface OfFetchOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Number of retries for transient failures (5xx, 429). Default 2. */
  retries?: number;
}

function buildUrl(path: string, query?: OfFetchOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Low-level fetch against OnlyFansAPI. Adds auth header, retries on 429/5xx with backoff.
 * Returns parsed JSON or throws OfApiError.
 */
export async function ofFetch<T = unknown>(path: string, options: OfFetchOptions = {}): Promise<T> {
  const { query, retries = 2, headers, ...rest } = options;
  const url = buildUrl(path, query);
  const apiKey = getApiKey();

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...rest,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
      });

      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after")) || 0;
        const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(2 ** attempt * 500, 4000);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      const text = await res.text();
      const body = text ? safeJson(text) : null;

      if (!res.ok) {
        throw new OfApiError(
          `OnlyFansAPI ${res.status} on ${path}: ${typeof body === "object" ? JSON.stringify(body) : text}`,
          res.status,
          body,
        );
      }

      return body as T;
    } catch (err) {
      lastError = err;
      if (err instanceof OfApiError && err.status < 500 && err.status !== 429) throw err;
      if (attempt === retries) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new OfApiError("OnlyFansAPI unknown failure", 500);
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export const ofGet = <T = unknown>(path: string, query?: OfFetchOptions["query"]) =>
  ofFetch<T>(path, { method: "GET", query });

export const ofPost = <T = unknown>(path: string, body?: unknown, query?: OfFetchOptions["query"]) =>
  ofFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, query });

export const ofPut = <T = unknown>(path: string, body?: unknown) =>
  ofFetch<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });

export const ofDelete = <T = unknown>(path: string) =>
  ofFetch<T>(path, { method: "DELETE" });

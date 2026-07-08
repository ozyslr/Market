/**
 * Shared utilities for real cargo provider HTTP clients.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

export class CargoApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'CargoApiError';
  }
}

/** Fetch wrapper with timeout and structured error handling for cargo APIs. */
export async function cargoFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      let body: string | undefined;
      try {
        body = await response.text();
      } catch {
        /* ignore */
      }
      throw new CargoApiError(
        `Cargo API responded with ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    return response;
  } catch (err) {
    if (err instanceof CargoApiError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new CargoApiError(`Cargo API request timed out after ${timeoutMs}ms`);
    }

    throw new CargoApiError(
      `Cargo API network error: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Build a Basic auth header value from key + secret. */
export function basicAuth(key: string, secret: string): string {
  return 'Basic ' + btoa(`${key}:${secret}`);
}

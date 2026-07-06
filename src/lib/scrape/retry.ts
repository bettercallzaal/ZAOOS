/**
 * withRetry - small retry-with-exponential-backoff wrapper for the scrapers'
 * live HTTP calls. Transient failures (network blips, 5xx, rate limits) are
 * common when scraping third-party sites; one failed request should not sink a
 * whole pagination run.
 *
 * The sleep function is injectable so tests run instantly with no real delay.
 */

export interface RetryOptions {
  /** Number of RETRIES after the first attempt. Default 2 (3 attempts total). */
  retries?: number;
  /** Base backoff delay in ms. Default 300. */
  baseDelayMs?: number;
  /** Backoff multiplier per attempt. Default 2 (300, 600, 1200, ...). */
  factor?: number;
  /** Decide whether a given error is retryable. Default: retry everything. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Injectable sleep (tests pass a no-op). Default: real setTimeout. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying on throw up to `retries` times with exponential backoff.
 * Re-throws the last error if all attempts fail or shouldRetry returns false.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 300;
  const factor = opts.factor ?? 2;
  const shouldRetry = opts.shouldRetry ?? (() => true);
  const sleep = opts.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const hasAttemptsLeft = attempt < retries;
      if (!hasAttemptsLeft || !shouldRetry(error, attempt)) {
        throw error;
      }
      await sleep(baseDelayMs * factor ** attempt);
    }
  }
  // Unreachable - the loop either returns or throws - but satisfies the type.
  throw lastError;
}

/**
 * Default retry predicate for HTTP scraping: retry on network errors, timeouts,
 * and 5xx / 429 responses, but not on 4xx (other than 429) which are permanent.
 * Callers throw errors whose message contains the status code.
 */
export function isRetryableHttpError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b(429|5\d{2})\b/.test(message)) return true;
  if (/\b4\d{2}\b/.test(message)) return false;
  // Network errors, aborts, timeouts have no status code - retry them.
  return true;
}

/*
 * withRetry
 * Wraps an async operation with retry logic — 2 retries, exponential backoff, optional timeout.
 * @param fn - The async operation to retry
 * @param options - Retry config: maxRetries (default 2), baseDelayMs (default 1000), timeoutMs (default 30000)
 * @returns The result of fn on success, or null when all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; baseDelayMs?: number; timeoutMs?: number },
): Promise<T | null> {
  const maxRetries = options?.maxRetries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const timeoutMs = options?.timeoutMs ?? 30000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn();
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === maxRetries) {
        if (err instanceof Error) console.error("[withRetry] All retries exhausted:", err.message);
        return null;
      }
      console.warn("[withRetry] Attempt", attempt + 1, "failed, retrying:", err instanceof Error ? err.message : err);
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

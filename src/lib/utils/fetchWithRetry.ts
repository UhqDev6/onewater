/**
 * Fetch utility with retry logic, timeout, and exponential backoff
 * Handles network failures gracefully with automatic retries
 */

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  timeout?: number;
  backoff?: number;
}

/**
 * Fetch with automatic retry and timeout
 * @param url - URL to fetch
 * @param options - Fetch options plus retry configuration
 * @returns Response object
 * @throws Error if all retries fail or timeout occurs
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    timeout = 10000,
    backoff = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success - return response
      if (response.ok) {
        return response;
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }

      // 5xx errors - retry
      if (attempt < retries) {
        const delay = backoff * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
        await sleep(delay);
        continue;
      }

      throw new Error(`API error: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If it's an abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms`);
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }

      // Wait before retry with exponential backoff
      const delay = backoff * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms due to: ${lastError.message}`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a network error that should be retried
 */
export function isRetryableError(error: Error): boolean {
  const retryableErrors = [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'AbortError',
  ];

  return retryableErrors.some(msg => 
    error.message.includes(msg) || error.name === msg
  );
}

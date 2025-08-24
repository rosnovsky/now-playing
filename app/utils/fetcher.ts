interface FetcherOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  retryBackoff?: number;
}

interface FetcherResponse<T> {
  status: number;
  data: T | null;
  headers: Headers;
  isStale?: boolean;
}

type FallbackFunction<T> = () => Promise<T> | T;

export async function fetcher<T>(
  url: string,
  options: FetcherOptions = {},
  fallbackFn?: FallbackFunction<T>
): Promise<FetcherResponse<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryBackoff = 2,
    ...requestOptions
  } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const stringHeaders: Record<string, string> = {};
  if (requestOptions.headers) {
    Object.entries(requestOptions.headers).forEach(([key, value]) => {
      if (value != null) {
        stringHeaders[key] = String(value);
      }
    });
  }

  const mergedOptions = {
    ...requestOptions,
    headers: {
      ...defaultHeaders,
      ...stringHeaders,
    },
  };

  let lastError: Error | null = null;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, mergedOptions);

      if (response.status === 304) {
        return { status: 304, data: null, headers: response.headers };
      }

      // Try to parse JSON - this is where we validate success
      let data: T;
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON parsing failed - this counts as a failure
        throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      }

      // If we get here, we have valid JSON - success!
      return { status: response.status, data, headers: response.headers };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= retryBackoff;
      }
    }
  }

  // All retries exhausted - try fallback if available
  if (fallbackFn) {
    try {
      const fallbackData = await fallbackFn();
      return {
        status: 200, // Indicate success but mark as stale
        data: fallbackData,
        headers: new Headers(),
        isStale: true
      };
    } catch (fallbackError) {
      // Fallback also failed - throw original error
      throw new Error(
        `Fetch failed after ${maxRetries + 1} attempts: ${lastError?.message}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}`
      );
    }
  }

  // No fallback available - throw the last error
  throw new Error(`Fetch failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
}

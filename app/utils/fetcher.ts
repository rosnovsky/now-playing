export async function fetcher(url: string, options: RequestInit = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const stringHeaders: Record<string, string> = {};
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (value != null) {
        stringHeaders[key] = String(value);
      }
    });
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...stringHeaders,
    },
  };

  const response = await fetch(url, mergedOptions);

  if (response.status === 304) {
    return { status: 304, data: null, headers: response.headers };
  }

  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

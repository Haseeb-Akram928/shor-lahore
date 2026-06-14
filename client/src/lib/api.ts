const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...fetchOptions } = options;
  const origin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;
  const url = new URL(`${API_BASE}${endpoint}`, origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiClientError(body.message || `HTTP ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, params?: FetchOptions['params']) =>
    request<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

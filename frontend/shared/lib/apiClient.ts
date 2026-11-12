const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:5000/api/v1');

export interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRedirect?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, skipAuthRedirect, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {};
  if (!(customConfig.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const timeout = AbortSignal.timeout(15000);
  const signal = customConfig.signal ? AbortSignal.any([customConfig.signal, timeout]) : timeout;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
    signal,
  });

  // Handle 401 Unauthorized for non-login endpoints
  if (response.status === 401 && !endpoint.includes('/auth/login') && !skipAuthRedirect) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aqarflow:unauthorized'));
      if (!window.location.pathname.startsWith('/login')) {
        const currentPath = window.location.pathname + window.location.search;
        const redirectParam = currentPath && currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
        window.location.href = `/login${redirectParam}`;
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

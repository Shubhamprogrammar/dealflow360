import { API_BASE_URL } from '@/config/env.config';

// ---------------------------------------------------------------------------
// Typed API error matching the backend's { success: false, message, error: { code } }
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Token helpers (localStorage-based, SSR-safe)
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'dealflow360.tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
}

function loadTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }));
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return loadTokens()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return loadTokens()?.refreshToken ?? null;
}

// ---------------------------------------------------------------------------
// Response envelope types
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken?: string }>;
    if (json.success && json.data.accessToken) {
      saveTokens(json.data.accessToken, rt);
      return json.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { noAuth?: boolean; isRetry?: boolean; rawResponse?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!options.noAuth) {
    if (path.startsWith('/portal') || path.startsWith('/auth/customer')) {
      // Use customer token
      const raw = typeof window !== 'undefined' ? localStorage.getItem('dealflow360.customer_session') : null;
      if (raw) {
        const session = JSON.parse(raw);
        if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
    } else {
      // Use staff token
      const token = loadTokens()?.accessToken;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  // Handle raw response (e.g., CSV download)
  if (options.rawResponse) return res as unknown as T;

  const json = await res.json();

  // Successful response — unwrap envelope
  if (res.ok && json.success) {
    return json as T;
  }

  // 401 — attempt token refresh (once)
  if (res.status === 401 && !options.noAuth && !options.isRetry) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      return request<T>(method, path, body, { ...options, isRetry: true });
    }

    // Refresh failed — clear tokens and redirect
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Error response
  const message = json.message || `Request failed with status ${res.status}`;
  const code = json.error?.code || 'API_ERROR';
  throw new ApiError(res.status, message, code);
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------
export const api = {
  get: <T = unknown>(path: string, noAuth = false) =>
    request<ApiResponse<T>>('GET', path, undefined, { noAuth }),

  post: <T = unknown>(path: string, body?: unknown, noAuth = false) =>
    request<ApiResponse<T>>('POST', path, body, { noAuth }),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<ApiResponse<T>>('PUT', path, body),

  delete: <T = unknown>(path: string) =>
    request<ApiResponse<T>>('DELETE', path),

  /** For endpoints that return non-JSON (e.g., CSV export) */
  getRaw: (path: string) =>
    request<Response>('GET', path, undefined, { rawResponse: true }),
};

// api.ts
// Central HTTP client for all backend requests.
// Automatically attaches the stored JWT when requiresAuth = true,
// and throws a typed ApiError on non-2xx responses so callers
// can distinguish 401 / 5xx / network failures cleanly.

import { Platform } from 'react-native';
import { getToken } from './secureStorage';

// ── Config ─────────────────────────────────────────────────────
const LAN_IP = '10.0.0.152';  // your machine's Wi-Fi IP
const PORT   = 5000;

// Web uses localhost. Everything else (phone, emulator) uses the
// LAN IP — the firewall rule on port 5000 covers all of them.
export const API_BASE_URL = Platform.OS === 'web'
  ? `http://localhost:${PORT}`
  : `http://${LAN_IP}:${PORT}`;

// ── Types ──────────────────────────────────────────────────────

export interface ApiError {
  status: number;    // HTTP status code
  error:  string;   // human-readable message from the server
  code?:  string;   // machine-readable error code (optional)
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserInfo {
  id:       number;
  username: string;
  role:     string;
}

export interface LoginResponse {
  message: string;
  token:   string;
  user:    UserInfo;
}

// ── Core request helper ────────────────────────────────────────

async function request<T>(
  path:         string,
  options:      RequestInit = {},
  requiresAuth: boolean     = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Attach JWT if this endpoint requires auth
  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    // Network-level failure (no internet, server unreachable, etc.)
    throw {
      status: 0,
      error:  'Unable to reach the server. Check your internet connection.',
    } as ApiError;
  }

  // Parse JSON (even on error responses — the server always returns JSON)
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const err = body as Partial<ApiError>;
    throw {
      status: response.status,
      error:  err.error  ?? `Request failed with status ${response.status}`,
      code:   err.code,
    } as ApiError;
  }

  return body as T;
}

// ── Public API surface ─────────────────────────────────────────

export const api = {
  /** Unauthenticated POST (login, register, etc.) */
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  /** Authenticated POST */
  authPost<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, true);
  },

  /** Authenticated GET */
  authGet<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' }, true);
  },
};

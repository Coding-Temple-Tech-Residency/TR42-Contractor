// api.ts
// Central HTTP client for all backend requests.
// Automatically attaches the stored JWT when requiresAuth = true,
// and throws a typed ApiError on non-2xx responses.

import { Platform } from 'react-native';
import { getToken } from './secureStorage';

// ── Config ─────────────────────────────────────────────────────
const LAN_IP = '10.0.0.152';            // ← your machine's Wi-Fi LAN IP
const PORT   = 5000;

function resolveBaseUrl(): string {
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://10.0.2.2:${PORT}`;
    if (Platform.OS === 'ios')     return `http://localhost:${PORT}`;
  }
  return `http://${LAN_IP}:${PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

// ── Types ──────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  error:  string;
  code?:  string;
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
    throw {
      status: 0,
      error:  'Unable to reach the server. Check your internet connection.',
    } as ApiError;
  }

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
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  authPost<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, true);
  },

  authGet<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' }, true);
  },

  authPut<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, true);
  },

  authPatch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, true);
  },
};

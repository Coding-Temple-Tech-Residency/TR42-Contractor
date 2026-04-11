// AuthContext.tsx
// Provides app-wide auth state: token, user info, login/logout helpers.
//
// On mount it checks expo-secure-store for a stored JWT and validates
// its expiry so the app can auto-login without hitting the server again.
//
// Usage:
//   const { isAuthenticated, isLoading, login, logout, user } = useAuth();

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { getToken, saveToken, deleteToken } from '../utils/secureStorage';
import type { UserInfo } from '../utils/api';

// ── Types ──────────────────────────────────────────────────────

interface AuthContextType {
  token:           string | null;
  user:            UserInfo | null;
  isAuthenticated: boolean;
  /** true while the initial SecureStore check is in flight */
  isLoading:       boolean;
  /** Store token + user state after a successful login API call */
  login:           (token: string, user: UserInfo) => Promise<void>;
  /** Clear token from SecureStore and reset state */
  logout:          () => Promise<void>;
}

// ── JWT decode helper (no third-party library needed) ──────────
// Only reads the payload; does NOT verify the signature (that's
// the backend's job). We just need the `exp` and `sub` fields.
//
// Uses a pure-JS base64 decoder so it works in all Hermes/JSC
// environments without relying on the browser-only `atob` global.

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Decode(input: string): string {
  // base64url → standard base64
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits   = 0;

  for (let i = 0; i < b64.length; i++) {
    const ch = b64[i];
    if (ch === '=') break;
    const idx = BASE64_CHARS.indexOf(ch);
    if (idx === -1) continue; // skip invalid chars (whitespace, newlines)
    buffer = (buffer << 6) | idx;
    bits  += 6;
    if (bits >= 8) {
      bits  -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const decoded = base64Decode(segment);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  // exp is in seconds; Date.now() is in milliseconds
  return Date.now() / 1000 > payload.exp;
}

// ── Context setup ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [user,      setUser]      = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app launch: restore session from SecureStore if token is still valid
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await getToken();

        if (stored && !isTokenExpired(stored)) {
          // Decode lightweight user info from the JWT payload.
          // Full user data (username, etc.) would need a /me endpoint call
          // if needed — for now we hydrate id and role from the token.
          const payload = decodeJwtPayload(stored);
          setToken(stored);
          setUser({
            id:       payload ? Number(payload.sub) : 0,
            username: '',   // not stored in our JWT payload
            role:     payload ? String(payload.role ?? '') : '',
          });
        } else if (stored) {
          // Token exists but has expired — clean it up
          await deleteToken();
        }
      } catch {
        // SecureStore read failure — treat as unauthenticated
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (newToken: string, userInfo: UserInfo) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(userInfo);
  };

  const logout = async () => {
    await deleteToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}

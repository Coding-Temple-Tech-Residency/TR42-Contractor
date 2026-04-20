// AuthContext.tsx
// Provides app-wide auth state: token, user info, login/logout helpers.
// On mount checks expo-secure-store for a stored JWT and validates expiry.

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
  isLoading:       boolean;
  login:           (token: string, user: UserInfo) => Promise<void>;
  logout:          () => Promise<void>;
}

// ── JWT decode helper ──────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64  = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() / 1000 > payload.exp;
}

// ── Context setup ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [user,      setUser]      = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await getToken();

        if (stored && !isTokenExpired(stored)) {
          const payload = decodeJwtPayload(stored);
          setToken(stored);
          setUser({
            id:       payload ? Number(payload.sub) : 0,
            username: '',
            role:     payload ? String(payload.role ?? '') : '',
          });
        } else if (stored) {
          await deleteToken();
        }
      } catch {
        // SecureStore read failure
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

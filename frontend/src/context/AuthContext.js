import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../util/storage';
import { loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Decode a JWT payload without a library.
// Returns null if the token is malformed.
function decodeTokenPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds; Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // true while we check SecureStore for a persisted token on startup
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    async function restore() {
      try {
        const storedToken = await storage.getItem(TOKEN_KEY);
        const storedUser = await storage.getItem(USER_KEY);

        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));
        } else if (storedToken) {
          // Token expired — clean up stale credentials
          await storage.deleteItem(TOKEN_KEY);
          await storage.deleteItem(USER_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  // Calls the API, persists token + user, updates state.
  // Throws on invalid credentials so the screen can show the error.
  const login = async (username, password) => {
    const data = await loginUser(username, password);
    await storage.setItem(TOKEN_KEY, data.token);
    await storage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Calls the API for registration.
  // On success returns the new user object; does NOT auto-login —
  // the screen navigates back to Login so the user signs in explicitly.
  const register = async (email, username, password, role = 'contractor') => {
    return registerUser(email, username, password, role);
  };

  const logout = async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

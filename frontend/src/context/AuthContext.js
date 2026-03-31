import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // true while we check SecureStore for a persisted token on startup
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((stored) => {
        if (stored) setToken(stored);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Calls the API, persists token, updates state.
  // Throws on invalid credentials so the screen can show the error.
  const login = async (username, password) => {
    const data = await loginUser(username, password);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
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

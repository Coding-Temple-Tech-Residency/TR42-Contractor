import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// ── Mocks ───────────────────────────────────────────────────────────────────

// In-memory storage stub
const store = {};
jest.mock('../../util/storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key, val) => {
      store[key] = val;
      return Promise.resolve();
    }),
    deleteItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  },
}));

// Mock the API layer
jest.mock('../../api/authApi', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

const storage = require('../../util/storage').default;
const { loginUser, registerUser } = require('../../api/authApi');

// Helper: build a fake JWT with a given exp (seconds since epoch)
function fakeJwt(exp) {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const payload = btoa(JSON.stringify({ sub: '1', role: 'contractor', exp }));
  return `${header}.${payload}.fakesig`;
}

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  it('starts in loading state then resolves with no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('restores a valid token and user from SecureStore', async () => {
    const validToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600); // expires in 1h
    const userData = { id: 1, username: 'testuser', role: 'contractor' };
    store['auth_token'] = validToken;
    store['auth_user'] = JSON.stringify(userData);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.token).toBe(validToken);
    expect(result.current.user).toEqual(userData);
  });

  it('clears an expired token on restore', async () => {
    const expiredToken = fakeJwt(Math.floor(Date.now() / 1000) - 60); // expired 1min ago
    store['auth_token'] = expiredToken;
    store['auth_user'] = JSON.stringify({ id: 1 });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(storage.deleteItem).toHaveBeenCalledWith('auth_token');
    expect(storage.deleteItem).toHaveBeenCalledWith('auth_user');
  });

  it('login stores token and user, then logout clears them', async () => {
    const token = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
    const user = { id: 1, username: 'aldo', role: 'contractor', email: 'a@b.com' };
    loginUser.mockResolvedValueOnce({ message: 'ok', token, user });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Login
    await act(async () => {
      await result.current.login('aldo', 'pass');
    });

    expect(result.current.token).toBe(token);
    expect(result.current.user).toEqual(user);
    expect(storage.setItem).toHaveBeenCalledWith('auth_token', token);
    expect(storage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(storage.deleteItem).toHaveBeenCalledWith('auth_token');
    expect(storage.deleteItem).toHaveBeenCalledWith('auth_user');
  });

  it('login propagates API errors', async () => {
    loginUser.mockRejectedValueOnce(new Error('invalid username or password'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('bad', 'creds');
      })
    ).rejects.toThrow('invalid username or password');

    expect(result.current.token).toBeNull();
  });

  it('register calls API without auto-login', async () => {
    const newUser = { id: 2, username: 'newbie', role: 'contractor', email: 'n@b.com' };
    registerUser.mockResolvedValueOnce(newUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let returned;
    await act(async () => {
      returned = await result.current.register('n@b.com', 'newbie', 'pass');
    });

    expect(returned).toEqual(newUser);
    // Should NOT set token — user must login explicitly
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

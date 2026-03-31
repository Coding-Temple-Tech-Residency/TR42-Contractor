import { loginUser, registerUser } from '../authApi';

// Mock global fetch
global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

describe('loginUser', () => {
  it('POSTs to /api/auth/login with correct payload and returns data', async () => {
    const mockResponse = {
      message: 'Successfully Logged in',
      token: 'abc123',
      user: { id: 1, email: 'test@test.com', username: 'testuser', role: 'contractor' },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await loginUser('testuser', 'password123');
    expect(result).toEqual(mockResponse);

    // Verify exact URL and payload match backend contract
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      }),
    );
  });

  it('throws on invalid credentials', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'invalid username or password' }),
    });

    await expect(loginUser('bad', 'creds')).rejects.toThrow('invalid username or password');
  });
});

describe('registerUser', () => {
  it('POSTs to /api/auth with correct payload and returns user data', async () => {
    const mockResponse = { id: 1, email: 'new@test.com', username: 'newuser', role: 'contractor' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await registerUser('new@test.com', 'newuser', 'pass123');
    expect(result).toEqual(mockResponse);

    // Verify exact URL and payload match backend contract
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@test.com', username: 'newuser', password: 'pass123', role: 'contractor' }),
      }),
    );
  });

  it('throws on duplicate username', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Username already taken' }),
    });

    await expect(registerUser('a@b.com', 'taken', 'pass')).rejects.toThrow('Username already taken');
  });

  it('formats validation errors from marshmallow', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ email: ['Not a valid email address.'] }),
    });

    await expect(registerUser('bad', 'user', 'pass')).rejects.toThrow('email: Not a valid email address.');
  });
});

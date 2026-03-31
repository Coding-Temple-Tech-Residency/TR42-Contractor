import { BASE_URL } from '../config/api';

// POST /api/auth/login
// Returns: { message, token, user: { id, email, username, role } }
export async function loginUser(username, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed. Please try again.');
  }

  return data;
}

// POST /api/auth
// Returns: { id, email, username, role }  (password excluded — load_only on backend)
export async function registerUser(email, username, password, role = 'contractor') {
  const response = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Marshmallow validation errors arrive as { field: ["msg", ...] }
    if (typeof data === 'object' && !data.error) {
      const messages = Object.entries(data)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(' ') : errs}`)
        .join('\n');
      throw new Error(messages || 'Registration failed. Please try again.');
    }
    throw new Error(data.error || 'Registration failed. Please try again.');
  }

  return data;
}

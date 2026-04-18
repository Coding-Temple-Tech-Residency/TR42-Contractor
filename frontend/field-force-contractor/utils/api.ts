// api.ts
// Central HTTP client for all backend requests.
// Automatically attaches the stored JWT when requiresAuth = true,
// and throws a typed ApiError on non-2xx responses.

import { Platform } from 'react-native';
import { getToken } from './secureStorage';

// ── Config ─────────────────────────────────────────────────────
//
// 📱 TESTING ON A PHYSICAL DEVICE (iPhone / Android)
// ---------------------------------------------------
// A real phone cannot reach `localhost` — that resolves to the phone
// itself, not your laptop. You must point it at your machine's
// Wi-Fi LAN IP and make sure the backend port is reachable on the
// network. Replace LAN_IP below with YOUR machine's IP.
//
// ── ONE-TIME MACHINE SETUP ────────────────────────────────────
//
// A. Backend (Flask + SQLite)
//    From repo root:
//      cd backend
//      python -m venv .venv
//      Windows :  .venv\Scripts\activate
//      macOS/Linux : source .venv/bin/activate
//      pip install -r requirements.txt
//      # If requirements.txt is missing any, also run:
//      #   pip install flask flask-cors flask-sqlalchemy python-dotenv \
//      #               marshmallow marshmallow-sqlalchemy python-jose bcrypt
//      python seed.py                 # create + seed users
//      python seed_inspections.py     # seed the inspection template
//
// B. Frontend (Expo / React Native)
//    From repo root:
//      cd frontend/field-force-contractor
//      npm install
//      npx expo install expo-secure-store expo-local-authentication
//    Install the Expo Go app on your phone (App Store / Play Store).
//
// C. Your machine and your phone MUST be on the SAME Wi-Fi network.
//    Work/guest/locked-down networks often block device-to-device
//    traffic — if nothing works, try a personal hotspot.
//
// ── PER-SESSION / PER-NETWORK SETUP ───────────────────────────
//
// 1. Find your LAN IP (laptop + phone must be on the SAME Wi-Fi):
//      Windows :  ipconfig            → "IPv4 Address" under Wi-Fi
//      macOS   :  ipconfig getifaddr en0
//      Linux   :  hostname -I
//    Typical values look like 10.0.0.xxx or 192.168.x.xxx.
//
// 2. Update LAN_IP below with what you found.
//
// 3. Open ports 5000 (Flask) and 8081 (Expo Metro) in your firewall:
//      Windows (PowerShell, admin):
//        netsh advfirewall firewall add rule name="Flask Dev" ^
//          dir=in action=allow protocol=TCP localport=5000
//        netsh advfirewall firewall add rule name="Expo Metro" ^
//          dir=in action=allow protocol=TCP localport=8081
//      macOS   :  System Settings → Network → Firewall → allow python / node
//      Linux   :  sudo ufw allow 5000 && sudo ufw allow 8081
//
// 4. Start the backend bound to all interfaces, not just localhost:
//      cd backend
//      flask run --host=0.0.0.0 --port=5000
//
// 5. Start Expo in a second terminal:
//      cd frontend/field-force-contractor
//      npx expo start              # scan the QR code with Expo Go
//      # If the phone can't find the dev server, try:
//      #   npx expo start --tunnel
//
// 6. From the phone's browser visit http://<LAN_IP>:5000/  — if you get
//    a JSON / 404 response, networking is good. If it times out, the
//    firewall is still blocking OR you're on a different Wi-Fi.
//
// Your LAN IP will change whenever you connect to a new network, so
// expect to update this line when switching between home/office/etc.
// ---------------------------------------------------
// ── Switch between local dev and deployed backend ─────────────
//
// After deploying to Render:
//   1. Paste your Render URL into DEPLOYED_API_URL below
//   2. Flip USE_DEPLOYED to true
//   3. Everyone on the team hits the same live API
//
const USE_DEPLOYED     = false;                            // ← flip to true after deploying
const DEPLOYED_API_URL = 'https://your-app.onrender.com'; // ← paste your Render URL here

const LAN_IP = '10.0.0.152';            // ← your machine's Wi-Fi LAN IP (local dev only)
const PORT   = 5000;

export const API_BASE_URL = USE_DEPLOYED
  ? DEPLOYED_API_URL
  : Platform.OS === 'web'
    ? `http://localhost:${PORT}`
    : `http://${LAN_IP}:${PORT}`;

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

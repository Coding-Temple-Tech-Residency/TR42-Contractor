# TR42 Contractor

A mobile-first field operations platform for managing contractors in the oil & gas industry.

## Overview

TR42 Contractor gives field service companies a secure, real-time tool to manage contractor authentication, work order assignment, and field task execution. It replaces manual paper-based workflows with a mobile platform that works across Android, iOS, and web.

**Target users:** Field contractors, vendor managers, and operations teams in oil & gas.

**Why it matters:** Reduces fraud risk through authenticated digital check-ins, improves data accuracy with real-time task tracking, and enables offline-capable field operations where connectivity is unreliable.

## Features

**Completed:**
- User registration and login with JWT authentication
- Role-based user accounts (contractor, vendor, client)
- Secure token storage (Keychain on iOS, Keystore on Android, localStorage on web)
- Session persistence across app restarts with automatic expired token cleanup
- Contractor profile viewing and editing
- Offline PIN setup for field access without connectivity
- Protected navigation (unauthenticated users redirected to login)
- Cross-platform support: Android emulator, iOS simulator, web browser
- CORS-enabled backend for local and cross-origin development
- Full test coverage for auth flow (backend + frontend)

**In Progress:**
- Work order assignment and task management
- Contractor task execution tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native, Expo SDK 51, React Navigation 6 |
| Backend | Python 3.13, Flask 3.1, Flask-CORS |
| Database | MySQL (dev), SQLite (testing) |
| ORM | SQLAlchemy 2.0, Marshmallow |
| Auth | JWT via python-jose, Werkzeug password hashing |
| Storage | Expo SecureStore (native), localStorage (web) |
| Testing | pytest (backend), Jest + Testing Library (frontend) |

## Architecture

```
Mobile App (Expo)          Flask API             MySQL
┌─────────────────┐    ┌───────────────┐    ┌──────────┐
│  React Native    │───>│  /api/auth    │───>│ auth_users│
│  React Navigation│    │  /api/contrac.│    │ contractors│
│  SecureStore     │<───│  JWT + CORS   │    │ work_orders│
└─────────────────┘    └───────────────┘    │ tasks     │
                                             └──────────┘
```

The frontend communicates with the Flask API over HTTP. Authentication uses JWT tokens stored in platform-secure storage. The backend validates tokens on every protected request via a `@token_required` decorator.

## Setup Instructions

### Prerequisites

- Python 3.13+
- Node.js 18+
- MySQL server (for development) or SQLite (for testing)
- Android Studio (for Android emulator) or Expo Go app (for physical device)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
./venv/Scripts/activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python flask_app.py
```

The backend starts on `http://0.0.0.0:5000`.

> **Note:** `flask_app.py` runs `db.drop_all()` then `db.create_all()` on startup. The database resets every time the server restarts. Register a new user after each restart.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start for web
npx expo start --web

# Start for Android emulator
npx expo start --android

# Start for iOS simulator
npx expo start --ios
```

### Platform-Specific Networking

| Platform | API URL used | Why |
|----------|-------------|-----|
| Web browser | `http://localhost:5000` | Same machine, direct access |
| Android emulator | `http://10.0.2.2:5000` | Emulator alias for host loopback (auto-detected) |
| iOS simulator | `http://localhost:5000` | Shares host network stack |
| Physical device | Set `EXPO_PUBLIC_API_URL` in `frontend/.env` | Must use your machine's LAN IP |

The frontend auto-detects the correct URL per platform. Override with an environment variable if needed:

```bash
# frontend/.env
EXPO_PUBLIC_API_URL=http://192.168.1.42:5000
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `JWT_SECRET_KEY` | Production only | `dev-insecure-key-do-not-use-in-prod` | Secret for signing JWT tokens |
| `DATABASE_URL` | Production only | MySQL localhost connection | SQLAlchemy database URI |

Generate a production secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | Physical device only | Auto-detected per platform | Backend API base URL |

## API Overview

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth` | Register a new user | No |
| `POST` | `/api/auth/login` | Login, returns JWT | No |
| `POST` | `/api/auth/offline-pin` | Set offline PIN | JWT required |

### Contractors (`/api/contractors`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/contractors/profile` | View contractor profile | JWT required |
| `PUT` | `/api/contractors/profile` | Update profile fields | JWT required |

## Running Tests

```bash
# Backend (13 tests)
cd backend
./venv/Scripts/python -m pytest tests/ -v

# Frontend (11 tests)
cd frontend
npm test
```

## Demo Instructions

1. Start the backend: `cd backend && python flask_app.py`
2. Start the frontend: `cd frontend && npx expo start --web` (or `--android`)
3. **Register** a new account on the Register screen
4. **Login** with the credentials you just created
5. You should see the Dashboard with your username and role
6. **Refresh the page** (web) or relaunch the app to verify session persistence
7. **Sign out** and confirm you're redirected to the login screen

## Known Issues & Notes

- **Database resets on restart** — `flask_app.py` drops and recreates all tables on every server start. This is intentional during development.
- **Expo cache** — If UI changes don't appear, stop Expo and restart with `npx expo start --clear`.
- **SecureStore on web** — `expo-secure-store` has no web implementation. The app uses `localStorage` as a fallback via `src/util/storage.js`. This is acceptable for development but not equivalent to native encrypted storage.
- **JWT secret** — Development uses a hardcoded fallback. Production requires the `JWT_SECRET_KEY` environment variable or the app will refuse to start.

## Team

| Name | Role |
|------|------|
| Aldo Pena Herrera | Full Stack (Backend focus) |
| Nicole Cespedes | Backend |
| Edward Cochran | Backend |
| James Bustamante | Backend |
| Jonathan Hubbard | Full Stack (Frontend focus) |
| Troy Wenzel | Frontend |
| Charlie Estrada | Frontend |
| Johnna Auman | Cybersecurity |

## Future Improvements

- **AI anomaly detection** — Flag suspicious task completions using pattern analysis
- **Offline sync** — Queue field data locally and sync when connectivity returns
- **GPS tracking** — Verify contractor location at job sites during check-in/check-out
- **Photo uploads** — Attach before/after evidence to completed tasks
- **Push notifications** — Alert contractors to new work order assignments
- **Biometric authentication** — Fingerprint/face unlock for faster field access

## License

This project was created as part of a Coding Temple Tech Residency. All work produced during the residency is considered the intellectual property of Coding Temple or the sponsoring employer, unless otherwise stated in a signed agreement.

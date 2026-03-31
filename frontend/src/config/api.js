// API base URL configuration.
//
// Set EXPO_PUBLIC_API_URL in a .env file to override per environment:
//   Android emulator  → http://10.0.2.2:5000
//   iOS simulator     → http://localhost:5000
//   Physical device   → http://<your-machine-LAN-IP>:5000
//
// Example .env:
//   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

// API base URL configuration.
//
// Override with EXPO_PUBLIC_API_URL in a .env file if needed:
//   Physical device → http://<your-machine-LAN-IP>:5000
//
// Otherwise the URL is chosen automatically per platform:
//   Android emulator → http://10.0.2.2:5000  (special alias for host loopback)
//   iOS simulator    → http://localhost:5000
//   Web browser      → http://localhost:5000

import { Platform } from 'react-native';

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
}

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl();

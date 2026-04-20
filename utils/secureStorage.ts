// secureStorage.ts
// Thin wrapper around expo-secure-store for tokens and PINs.

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY       = 'auth_token';
const OFFLINE_PIN_KEY = 'offline_pin';

// ── Token helpers ──────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Offline PIN helpers ────────────────────────────────────────

export async function saveOfflinePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(OFFLINE_PIN_KEY, pin);
}

export async function getOfflinePin(): Promise<string | null> {
  return SecureStore.getItemAsync(OFFLINE_PIN_KEY);
}

export async function deleteOfflinePin(): Promise<void> {
  await SecureStore.deleteItemAsync(OFFLINE_PIN_KEY);
}

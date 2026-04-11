// secureStorage.ts
// Thin wrapper around expo-secure-store so every other file uses a single API.
// expo-secure-store encrypts data using the device keychain (iOS) /
// Android Keystore (Android), making it safe for tokens and PINs.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY       = 'auth_token';
const OFFLINE_PIN_KEY = 'offline_pin';

// On web, expo-secure-store uses localStorage under the hood.
// These helpers fall back to localStorage directly when SecureStore
// throws (e.g., unavailable context or size limits on web).

async function set(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      throw e;
    }
  }
}

async function get(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    throw e;
  }
}

async function remove(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      throw e;
    }
  }
}

// ── Token helpers ──────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await set(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return get(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await remove(TOKEN_KEY);
}

// ── Offline PIN helpers ────────────────────────────────────────

export async function saveOfflinePin(pin: string): Promise<void> {
  await set(OFFLINE_PIN_KEY, pin);
}

export async function getOfflinePin(): Promise<string | null> {
  return get(OFFLINE_PIN_KEY);
}

export async function deleteOfflinePin(): Promise<void> {
  await remove(OFFLINE_PIN_KEY);
}

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Unified async storage interface.
// iOS/Android → expo-secure-store (encrypted keychain / keystore)
// Web         → localStorage (SecureStore is not available on web)

async function getItem(key) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function deleteItem(key) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export default { getItem, setItem, deleteItem };

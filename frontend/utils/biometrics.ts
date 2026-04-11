import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export type PreferredBiometricMethod = 'face' | 'fingerprint';

type BiometricCopy = {
  label: string;
  badgeIcon: 'scan-outline' | 'finger-print';
  scanIcon: 'scan' | 'finger-print';
  hintText: string;
  promptMessage: string;
};

export function getBiometricCopy(method: PreferredBiometricMethod): BiometricCopy {
  if (method === 'face') {
    return {
      label: 'Face ID',
      badgeIcon: 'scan-outline',
      scanIcon: 'scan',
      hintText: 'Tap to scan your face',
      promptMessage: 'Use Face ID to verify your identity.',
    };
  }

  return {
    label: 'Fingerprint',
    badgeIcon: 'finger-print',
    scanIcon: 'finger-print',
    hintText: 'Tap to scan your fingerprint',
    promptMessage: 'Scan your fingerprint to verify your identity.',
  };
}

export async function detectPreferredBiometric(): Promise<{
  available: boolean;
  method: PreferredBiometricMethod;
  unavailableMsg: string;
}> {
  const fallbackMethod: PreferredBiometricMethod = Platform.OS === 'ios' ? 'face' : 'fingerprint';

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return {
      available: false,
      method: fallbackMethod,
      unavailableMsg: 'This device does not support biometric authentication.',
    };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return {
      available: false,
      method: fallbackMethod,
      unavailableMsg:
        Platform.OS === 'ios'
          ? 'Face ID is not set up on this iPhone. Set it up in Settings to continue.'
          : 'Fingerprint authentication is not set up on this device. Set it up in Settings to continue.',
    };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

  const method: PreferredBiometricMethod =
    Platform.OS === 'ios'
      ? (hasFace ? 'face' : (hasFingerprint ? 'fingerprint' : fallbackMethod))
      : (hasFingerprint ? 'fingerprint' : (hasFace ? 'face' : fallbackMethod));

  return {
    available: true,
    method,
    unavailableMsg: '',
  };
}

export async function promptBiometric(promptMessage: string) {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
}

// BiometricScreen.tsx
// Second step of the login flow. Verifies the user's identity using the
// device biometrics (Face ID or fingerprint) before granting app access.
//
// The JWT is already stored in SecureStore by LoginScreen — this screen
// just adds a device-level security gate before navigating to Home.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import {
  detectPreferredBiometric,
  getBiometricCopy,
  promptBiometric,
  type PreferredBiometricMethod,
} from '../utils/biometrics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BiometricCheck'>;

export default function BiometricScreen() {
  useSetNavigationUI(UI.none);
  const navigation = useNavigation<Nav>();

  const [scanState,       setScanState]       = useState<'idle' | 'scanning' | 'failed'>('idle');
  const [biometricMethod, setBiometricMethod] = useState<PreferredBiometricMethod>('fingerprint');
  const [biometricReady,  setBiometricReady]  = useState<boolean | null>(null); // null = checking
  const [unavailableMsg,  setUnavailableMsg]  = useState('');

  // Check hardware + enrollment once on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const availability = await detectPreferredBiometric();
      setBiometricMethod(availability.method);
      setBiometricReady(availability.available);
      setUnavailableMsg(availability.unavailableMsg);
    };

    checkBiometrics();
  }, []);
  const biometricCopy = getBiometricCopy(biometricMethod);

  const handleScan = async () => {
    if (scanState === 'scanning' || !biometricReady) return;

    setScanState('scanning');

    try {
      const result = await promptBiometric(biometricCopy.promptMessage);

      if (result.success) {
        navigation.replace('Home');
      } else {
        setScanState('failed');
      }
    } catch {
      setScanState('failed');
    }
  }

  const scanIconColor = scanState === 'failed' ? colors.error : colors.primary;

  // ── Biometrics not available on this device ────────────────

  if (biometricReady === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <FieldForceHeader showAvatar={false} />
        <SubHeader title="Security Check" />
        <View style={styles.body}>
          <Ionicons name="warning-outline" size={64} color={colors.warning} />
          <Text style={styles.unavailableText}>{unavailableMsg}</Text>
          {/* Skip biometric and go directly to Home — the JWT is already valid */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Home')}>
            <Text style={styles.skipBtnText}>Continue without biometrics</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Checking availability ──────────────────────────────────

  if (biometricReady === null) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <FieldForceHeader showAvatar={false} />
        <SubHeader title="Security Check" />
        <View style={styles.body}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main biometric UI ──────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <FieldForceHeader showAvatar={false} />
      <SubHeader title="Security Check" />

      <View style={styles.body}>

        <Text style={styles.promptText}>BIOMETRIC IDENTITY</Text>
        <Text style={styles.promptText}>CHECK REQUIRED</Text>

        {/* The OS decides the exact biometric prompt; we show the preferred method for this device. */}
        <View style={styles.methodRow}>
          <View style={[styles.methodBtn, styles.methodBtnActive]}>
            <Ionicons
              name={biometricCopy.badgeIcon}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.methodLabel, styles.methodLabelActive]}>
              {biometricCopy.label}
            </Text>
          </View>
        </View>

        {/* Scan button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            scanState === 'scanning' && styles.scanButtonScanning,
            scanState === 'failed'   && styles.scanButtonFailed,
          ]}
          onPress={handleScan}
          activeOpacity={0.85}
          disabled={scanState === 'scanning'}
        >
          {scanState === 'scanning' ? (
            <ActivityIndicator size={64} color={colors.primary} />
          ) : (
            <Ionicons name={biometricCopy.scanIcon} size={80} color={scanIconColor} />
          )}
        </TouchableOpacity>

        {scanState === 'idle' && (
          <Text style={styles.hintText}>{biometricCopy.hintText}</Text>
        )}

        {scanState === 'scanning' && (
          <Text style={styles.hintText}>Scanning…</Text>
        )}

        {scanState === 'failed' && (
          <View style={styles.failedSection}>
            <Text style={styles.errorText}>Scan failed — please try again.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setScanState('idle')}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
  },
  promptText: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.lg,
    color:         colors.primary,
    letterSpacing: 1.5,
    textAlign:     'center',
  },
  methodRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginTop:     spacing.sm,
  },
  methodBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   10,
    paddingHorizontal: spacing.md,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    backgroundColor:   colors.card,
  },
  methodBtnActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  methodLabel:       { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  methodLabelActive: { fontFamily: fonts.bold, color: colors.primary },
  scanButton: {
    width:           160,
    height:          160,
    borderRadius:    24,
    borderWidth:     3,
    borderColor:     colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginVertical:  spacing.md,
    backgroundColor: 'rgba(255,140,0,0.05)',
  },
  scanButtonScanning: {
    borderColor:     colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scanButtonFailed: {
    borderColor:     colors.error,
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  hintText:  { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  errorText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error, textAlign: 'center' },
  failedSection: { alignItems: 'center', gap: spacing.sm },
  retryButton: {
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingVertical:   12,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: { fontFamily: fonts.bold, color: colors.textWhite, fontSize: fontSize.base },
  switchLink: { marginTop: spacing.xs },
  switchLinkText: {
    fontFamily:         fonts.regular,
    fontSize:           fontSize.sm,
    color:              colors.textMuted,
    textDecorationLine: 'underline',
  },
  unavailableText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.base,
    color:      colors.textLight,
    textAlign:  'center',
    marginTop:  spacing.md,
    lineHeight: 22,
    maxWidth:   300,
  },
  skipBtn: {
    marginTop:         spacing.lg,
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingVertical:   14,
    paddingHorizontal: spacing.xl,
  },
  skipBtnText: {
    fontFamily: fonts.regular,
    color:      colors.textLight,
    fontSize:   fontSize.base,
  },
});

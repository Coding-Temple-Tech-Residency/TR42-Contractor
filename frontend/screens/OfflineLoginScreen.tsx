// OfflineLoginScreen.tsx
// Handles login when the device has no internet connection.
//
// Flow:
//   1. Biometric scan using expo-local-authentication (real device auth).
//   2. If biometrics fail or are unavailable → 6-digit PIN fallback.
//   3. PIN is validated against the value stored in expo-secure-store,
//      which was saved when the contractor set up their offline PIN online.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { getOfflinePin } from '../utils/secureStorage';
import {
  detectPreferredBiometric,
  getBiometricCopy,
  promptBiometric,
  type PreferredBiometricMethod,
} from '../utils/biometrics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfflineLogin'>;

export default function OfflineLoginScreen() {
  const navigation = useNavigation<Nav>();

  const [currentStep,     setCurrentStep]     = useState<'biometric' | 'pin'>('biometric');
  const [biometricMethod, setBiometricMethod] = useState<PreferredBiometricMethod>('fingerprint');
  const [scanState,       setScanState]       = useState<'idle' | 'scanning' | 'failed'>('idle');
  const [biometricReady,  setBiometricReady]  = useState<boolean | null>(null); // null = still checking

  const [pin,      setPin]      = useState('');
  const [pinError, setPinError] = useState('');

  // Check biometric availability on mount and auto-skip to PIN if unavailable
  useEffect(() => {
    const checkBiometrics = async () => {
      const availability = await detectPreferredBiometric();
      setBiometricMethod(availability.method);
      setBiometricReady(availability.available);

      if (!availability.available) {
        // No biometrics — skip straight to PIN
        setCurrentStep('pin');
      }
    };

    checkBiometrics();
  }, []);
  const biometricCopy = getBiometricCopy(biometricMethod);

  const handleBiometricScan = async () => {
    if (scanState === 'scanning' || !biometricReady) return;
    setScanState('scanning');

    try {
      const result = await promptBiometric('Verify your identity to log in offline.');

      if (result.success) {
        navigation.replace('Dashboard');
      } else {
        setScanState('failed');
      }
    } catch {
      setScanState('failed');
    }
  };

  const goToPinStep = () => {
    setCurrentStep('pin');
    setScanState('idle');
    setPin('');
    setPinError('');
  };

  // ── PIN step handlers ────────────────────────────────────

  const handlePinChange = (newValue: string) => {
    const digitsOnly = newValue.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    setPinError('');
  };

  const handlePinLogin = async () => {
    if (pin.length === 0) {
      setPinError('Please enter your 6-digit PIN.');
      return;
    }

    if (pin.length < 6) {
      setPinError(`PIN is too short — please enter all 6 digits (${pin.length}/6 entered).`);
      return;
    }

    // Retrieve the PIN that was saved to SecureStore when the contractor
    // set up offline access online (via their profile / POST /auth/offline-pin).
    const savedPin = await getOfflinePin();

    if (savedPin === null) {
      setPinError('No offline PIN is set up for this device. Please connect to the internet and log in to set one.');
      return;
    }

    if (pin !== savedPin) {
      setPinError('Incorrect PIN. Please try again.');
      return;
    }

    navigation.replace('Dashboard');
  };

  // ── Render ───────────────────────────────────────────────

  // Still checking biometric availability — show a spinner
  if (biometricReady === null) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <FieldForceHeader showAvatar={false} />
        <SubHeader title="Security Check" />
        <View style={styles.bioBody}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <FieldForceHeader showAvatar={false} />
      <SubHeader
        title={currentStep === 'biometric' ? 'Security Check' : 'Offline PIN'}
        onBack={currentStep === 'pin' && biometricReady ? () => setCurrentStep('biometric') : undefined}
      />

      {/* ── STEP 1: BIOMETRIC ─────────────────────────────── */}
      {currentStep === 'biometric' && (
        <View style={styles.bioBody}>

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
              styles.scanBtn,
              scanState === 'scanning' && styles.scanBtnScanning,
              scanState === 'failed'   && styles.scanBtnFailed,
            ]}
            onPress={handleBiometricScan}
            activeOpacity={0.85}
            disabled={scanState === 'scanning'}
          >
            {scanState === 'scanning' ? (
              <ActivityIndicator size={64} color={colors.primary} />
            ) : (
              <Ionicons
                name={biometricCopy.scanIcon}
                size={80}
                color={scanState === 'failed' ? colors.error : colors.primary}
              />
            )}
          </TouchableOpacity>

          {scanState === 'idle' && (
            <Text style={styles.hintText}>{biometricCopy.hintText}</Text>
          )}
          {scanState === 'scanning' && (
            <Text style={styles.hintText}>Scanning…</Text>
          )}

          {/* Failed state: retry + PIN fallback */}
          {scanState === 'failed' && (
            <View style={styles.failedSection}>
              <Text style={styles.failedText}>Biometric scan failed.</Text>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setScanState('idle')}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pinFallbackBtn}
                onPress={goToPinStep}
                activeOpacity={0.8}
              >
                <Ionicons name="keypad-outline" size={16} color={colors.primary} />
                <Text style={styles.pinFallbackText}>Use Offline PIN instead</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      )}

      {/* ── STEP 2: PIN FALLBACK ──────────────────────────── */}
      {currentStep === 'pin' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.pinScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.keypadIllustration}>
              <Ionicons name="keypad" size={64} color={colors.primary} />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                {biometricReady
                  ? 'Biometric login failed. Enter your 6-digit offline PIN to continue.'
                  : 'Biometrics unavailable. Enter your 6-digit offline PIN to continue.'}
              </Text>
            </View>

            <View style={styles.pinForm}>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Offline PIN</Text>
                  <Text style={styles.pinCounter}>{pin.length}/6</Text>
                </View>

                <TextInput
                  style={[styles.pinInput, pinError !== '' && styles.pinInputError]}
                  value={pin}
                  onChangeText={handlePinChange}
                  placeholder="Enter 6-digit PIN"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  autoFocus
                />

                {pinError !== '' && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={styles.errorText}>{pinError}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, pin.length < 6 && styles.btnDisabled]}
                onPress={handlePinLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation.navigate('OfflinePinReset')}
                activeOpacity={0.8}
              >
                <Text style={styles.forgotBtnText}>Forgot PIN? Request a new one</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex:      { flex: 1 },

  // ── Biometric step styles ────────────────────────────────
  bioBody: {
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
  methodRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
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
  scanBtn: {
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
  scanBtnScanning: {
    borderColor:     colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scanBtnFailed: {
    borderColor:     colors.error,
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  hintText:  { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  failedSection: { alignItems: 'center', gap: spacing.sm },
  failedText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.error,
    textAlign:  'center',
  },
  retryBtn: {
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingVertical:   12,
    paddingHorizontal: spacing.xl,
  },
  retryBtnText: { fontFamily: fonts.bold, color: colors.textWhite, fontSize: fontSize.base },
  pinFallbackBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   12,
    paddingHorizontal: spacing.lg,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.primary,
    backgroundColor:   colors.primaryFaint,
    marginTop:         spacing.xs,
  },
  pinFallbackText: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.sm,
    color:      colors.primary,
  },
  switchLinkText: {
    fontFamily:         fonts.regular,
    fontSize:           fontSize.sm,
    color:              colors.textMuted,
    textDecorationLine: 'underline',
  },

  // ── PIN step styles ──────────────────────────────────────
  pinScroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xl,
  },
  keypadIllustration: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: '#1e2d45',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.lg,
  },
  infoBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             spacing.sm,
    backgroundColor: colors.primaryFaint,
    borderWidth:     1,
    borderColor:     colors.primary,
    borderRadius:    radius.md,
    padding:         spacing.md,
    marginBottom:    spacing.lg,
    width:           '100%',
    maxWidth:        380,
  },
  infoText: {
    flex:       1,
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textLight,
    lineHeight: 20,
  },
  pinForm: { width: '100%', maxWidth: 380, gap: spacing.md },
  fieldGroup: { gap: 6 },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  label: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  pinCounter: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textMuted,
  },
  pinInput: {
    width:             '100%',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   14,
    fontFamily:        fonts.bold,
    color:             colors.textWhite,
    fontSize:          fontSize.xl,
    textAlign:         'center',
    letterSpacing:     8,
  },
  pinInputError: { borderColor: colors.error },
  errorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     2,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.error,
    flex:       1,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  btnDisabled:  { backgroundColor: colors.cardAlt },
  loginBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  forgotBtnText: {
    fontFamily:         fonts.regular,
    fontSize:           fontSize.sm,
    color:              colors.textMuted,
    textDecorationLine: 'underline',
  },
});

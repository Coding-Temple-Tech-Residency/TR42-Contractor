// OfflineLoginScreen.tsx
// Handles login when the device has no internet connection.
//
// The flow works like this:
//   1. The user first tries biometric login (Face ID or Fingerprint),
//      the same way they would when online.
//   2. If biometrics fail, the screen switches to a 6-digit PIN fallback.
//   3. If the PIN is correct, they are taken to the Dashboard.
//
// The PIN is a backup — it only appears if biometrics don't work.
//
// ─────────────────────────────────────────────────────────────
// DEV BEHAVIOR (remove before going live):
//   - Biometrics are forced to FAIL when offline so we can
//     always reach and test the PIN fallback screen.
//   - Biometrics WORK normally when online (random 70% success).
//   - The dev PIN is set to "123456" for testing.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfflineLogin'>;

// ─────────────────────────────────────────────────────────────
// DEV ONLY — remove this entire block before production.
// In production, the PIN should be fetched from expo-secure-store
// where it was saved when the contractor first set it up online.
// ─────────────────────────────────────────────────────────────
const DEV_PIN = '123456';

export default function OfflineLoginScreen() {
  const navigation = useNavigation<Nav>();

  // Controls which step is showing:
  //   'biometric' = the Face ID / Fingerprint scan screen (shown first)
  //   'pin'       = the 6-digit PIN fallback (shown if biometrics fail)
  const [currentStep,    setCurrentStep]    = useState('biometric');
  const [biometricMethod, setBiometricMethod] = useState('fingerprint');
  const [scanState,      setScanState]      = useState('idle');

  // PIN step state
  const [pin,      setPin]      = useState('');
  const [pinError, setPinError] = useState('');

  // ─── Biometric step handlers ─────────────────────────────

  const switchBiometricMethod = (method: string) => {
    setBiometricMethod(method);
    setScanState('idle');
  };

  const handleBiometricScan = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');

    setTimeout(() => {
      // ─────────────────────────────────────────────────────
      // DEV ONLY: We force biometrics to always FAIL when
      // offline so testers can reach the PIN screen every time.
      //
      // In production, replace this whole block with a real
      // expo-local-authentication call, for example:
      //   const result = await LocalAuthentication.authenticateAsync({
      //     promptMessage: 'Verify your identity',
      //   });
      //   if (result.success) { navigation.replace('Dashboard'); }
      //   else { setScanState('failed'); }
      //
      // The real biometric result will determine success or failure
      // based on the device hardware — no random value needed.
      // ─────────────────────────────────────────────────────
      const biometricSuccess = false; // DEV ONLY: always fail offline
      // ─────────────────────────────────────────────────────

      if (biometricSuccess) {
        navigation.replace('Dashboard');
      } else {
        setScanState('failed');
      }
    }, 1500);
  };

  // When the user taps "Use PIN instead" or after biometric failure
  const goToPinStep = () => {
    setCurrentStep('pin');
    setScanState('idle');
    setPin('');
    setPinError('');
  };

  // ─── PIN step handlers ───────────────────────────────────

  const handlePinChange = (newValue: string) => {
    // Only allow numbers — strip out anything that isn't a digit
    const digitsOnly = newValue.replace(/\D/g, '');

    // Hard cap at 6 digits (maxLength on the input also enforces this,
    // but we do it here too just to be safe)
    const trimmed = digitsOnly.slice(0, 6);

    setPin(trimmed);
    setPinError(''); // clear any previous error while they're typing
  };

  const handlePinLogin = () => {
    // Validate the PIN before trying to log in
    if (pin.length === 0) {
      setPinError('Please enter your 6-digit PIN.');
      return;
    }

    if (pin.length < 6) {
      setPinError(`PIN is too short — please enter all 6 digits (${pin.length}/6 entered).`);
      return;
    }

    // At this point pin.length === 6 because of the maxLength + trimming above
    // Now check if the PIN is correct
    // ─────────────────────────────────────────────────────
    // DEV ONLY: We compare against a hardcoded PIN.
    // In production, replace this with:
    //   const savedPin = await SecureStore.getItemAsync('offlinePin');
    //   if (pin !== savedPin) { setPinError(...); return; }
    // ─────────────────────────────────────────────────────
    if (pin !== DEV_PIN) {
      setPinError('Incorrect PIN. Please try again.');
      return;
    }
    // ─────────────────────────────────────────────────────

    // PIN is correct — go to the dashboard
    navigation.replace('Dashboard');
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <FieldForceHeader showAvatar={false} />
      <SubHeader
        title={currentStep === 'biometric' ? 'Security Check' : 'Offline PIN'}
        // If they're on the PIN step, the back arrow goes back to biometric
        onBack={currentStep === 'pin' ? () => setCurrentStep('biometric') : undefined}
      />

      {/* ─────────────────────────────────────────────────────
          STEP 1: BIOMETRIC
          Same look and feel as the online biometric screen.
          For dev purposes, this always fails when offline.
      ───────────────────────────────────────────────────── */}
      {currentStep === 'biometric' && (
        <View style={styles.bioBody}>

          <Text style={styles.promptText}>BIOMETRIC IDENTITY</Text>
          <Text style={styles.promptText}>CHECK REQUIRED</Text>

          {/* Face ID / Fingerprint toggle */}
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodBtn, biometricMethod === 'face' && styles.methodBtnActive]}
              onPress={() => switchBiometricMethod('face')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color={biometricMethod === 'face' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.methodLabel, biometricMethod === 'face' && styles.methodLabelActive]}>
                Face ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodBtn, biometricMethod === 'fingerprint' && styles.methodBtnActive]}
              onPress={() => switchBiometricMethod('fingerprint')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="finger-print"
                size={20}
                color={biometricMethod === 'fingerprint' ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.methodLabel, biometricMethod === 'fingerprint' && styles.methodLabelActive]}>
                Fingerprint
              </Text>
            </TouchableOpacity>
          </View>

          {/* Big scan button */}
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
                name={biometricMethod === 'face' ? 'scan' : 'finger-print'}
                size={80}
                color={scanState === 'failed' ? colors.error : colors.primary}
              />
            )}
          </TouchableOpacity>

          {/* State messages */}
          {scanState === 'idle' && (
            <Text style={styles.hintText}>
              {biometricMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
            </Text>
          )}
          {scanState === 'scanning' && (
            <Text style={styles.hintText}>Scanning…</Text>
          )}

          {/* After biometric fails, show retry + PIN option */}
          {scanState === 'failed' && (
            <View style={styles.failedSection}>
              <Text style={styles.failedText}>Biometric scan failed.</Text>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setScanState('idle')}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>

              {/* PIN fallback link — this is the key feature of offline login */}
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

          {/* Quick method switch when idle */}
          {scanState === 'idle' && (
            <TouchableOpacity
              onPress={() => switchBiometricMethod(biometricMethod === 'face' ? 'fingerprint' : 'face')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchLinkText}>
                Use {biometricMethod === 'face' ? 'fingerprint' : 'Face ID'} instead
              </Text>
            </TouchableOpacity>
          )}

          {/* DEV ONLY banner — reminds testers that biometrics are intentionally broken offline */}
          {/* ─────────────────────────────────────────────────────────────────────────────────
              DEV ONLY: Remove this entire View before production.
              This banner is only here to remind testers that biometrics will always
              fail in offline mode during development. In production, remove the
              banner AND change biometricSuccess above to use real LocalAuthentication.
          ───────────────────────────────────────────────────────────────────────────────── */}
          <View style={styles.devBanner}>
            <Ionicons name="construct-outline" size={14} color={colors.warning} />
            <Text style={styles.devBannerText}>
              DEV MODE: Biometrics always fail offline. Use PIN: {DEV_PIN}
            </Text>
          </View>

        </View>
      )}

      {/* ─────────────────────────────────────────────────────
          STEP 2: PIN FALLBACK
          Only reached if biometrics failed.
          Requires exactly 6 digits.
      ───────────────────────────────────────────────────── */}
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
            {/* Keypad illustration */}
            <View style={styles.keypadIllustration}>
              <Ionicons name="keypad" size={64} color={colors.primary} />
            </View>

            {/* Explanation — tells the user why they're seeing this */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Biometric login failed. Enter your 6-digit offline PIN to continue.
              </Text>
            </View>

            <View style={styles.pinForm}>

              {/* PIN input */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Offline PIN</Text>
                  {/* Shows how many digits they've entered */}
                  <Text style={styles.pinCounter}>{pin.length}/6</Text>
                </View>

                <TextInput
                  style={[styles.pinInput, pinError !== '' && styles.pinInputError]}
                  value={pin}
                  onChangeText={handlePinChange}
                  placeholder="Enter 6-digit PIN"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"  // shows number pad on mobile
                  secureTextEntry         // shows dots instead of digits
                  maxLength={6}
                  autoFocus
                />

                {/* Error message — only shown when there's an error */}
                {pinError !== '' && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={styles.errorText}>{pinError}</Text>
                  </View>
                )}
              </View>

              {/* Login button — only fully active when exactly 6 digits entered */}
              <TouchableOpacity
                style={[styles.loginBtn, pin.length < 6 && styles.btnDisabled]}
                onPress={handlePinLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>

              {/* Link to request a PIN reset from the vendor */}
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

  // ── Biometric step styles ─────────────────────────────────
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
  hintText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
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
  // The PIN fallback button — stands out more than the retry button
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
  // DEV ONLY banner at the bottom of the biometric screen
  devBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(245,158,11,0.10)',
    borderWidth:       1,
    borderColor:       colors.warning,
    borderRadius:      radius.md,
    paddingVertical:   8,
    paddingHorizontal: spacing.md,
    marginTop:         spacing.sm,
  },
  devBannerText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.warning,
    flex:       1,
  },

  // ── PIN step styles ───────────────────────────────────────
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
  // Small counter on the right: "3/6"
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
    fontSize:          fontSize.xl,      // larger text so the dots are easy to see
    textAlign:         'center',
    letterSpacing:     8,                // spaces out the dots visually
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
// PasswordResetScreen.tsx
// This screen has two steps:
//   Step 1 — The user enters their email + new password
//   Step 2 — They verify their identity with Face ID or fingerprint
//            before the password is actually saved
//
// There's no bottom navigation bar here because the user
// shouldn't be navigating elsewhere mid-reset.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PasswordReset'>;

export default function PasswordResetScreen() {
  const navigation = useNavigation<Nav>();

  // Step 1 form fields
  const [email,           setEmail]           = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  // Which step we're on — 'form' or 'biometric'
  const [currentStep, setCurrentStep] = useState('form');

  // Biometric state for step 2
  const [biometricMethod, setBiometricMethod] = useState('fingerprint');
  const [scanState,       setScanState]       = useState('idle');

  // The Continue button should only be enabled when all fields are filled
  // and the passwords match each other
  const formIsReady =
    email.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  // Runs when the user taps "Continue to Verification"
  const handleContinue = () => {
    if (!formIsReady) return;
    setCurrentStep('biometric');
  }

  // Switches biometric method and resets the scan state
  const switchBiometricMethod = (method: string) => {
    setBiometricMethod(method);
    setScanState('idle');
  }

  // Runs when the user taps the biometric scan button
  const handleBiometricScan = () => {
    if (scanState === 'scanning') return;

    setScanState('scanning');

    // TODO: Replace with real biometric call using expo-local-authentication:
    //   const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify identity' });
    //   if (result.success) { save the password, then navigate to Login }
    //   else { setScanState('failed'); }
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate while testing

      if (success) {
        // TODO: Call your password-reset API here with email + newPassword before navigating
        Alert.alert(
          'Password Reset',
          'Your password has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
      } else {
        setScanState('failed');
      }
    }, 1500);
  }

  // When the back arrow is pressed on step 2, go back to the form
  // instead of leaving the screen entirely
  const handleBackPress = () => {
    if (currentStep === 'biometric') {
      setCurrentStep('form');
      setScanState('idle');
    } else {
      navigation.goBack();
    }
  }

  return (
    <MainFrame header="default" headerMenu={['none']} footerMenu={['none']}>

      {/* ── STEP 1: The password reset form ─────────────────── */}
      {currentStep === 'form' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Lock icon with a refresh badge to represent "reset" */}
            <View style={styles.illustrationWrap}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="lock-closed" size={48} color={colors.textWhite} />
              </View>
              <View style={styles.refreshBadge}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </View>
            </View>

            <View style={styles.form}>

              {/* Email field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* New password field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View>
                  <TextInput
                    style={[styles.input, styles.inputPadRight]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                    <Ionicons
                      name={showNew ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View>
                  <TextInput
                    style={[styles.input, styles.inputPadRight]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {/* Only show the mismatch message if they've started typing in confirm */}
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.mismatchText}>Passwords do not match</Text>
                )}
              </View>

              {/* Continue button — grayed out until form is valid */}
              <TouchableOpacity
                style={[styles.primaryBtn, !formIsReady && styles.btnDisabled]}
                onPress={handleContinue}
                activeOpacity={0.85}
                disabled={!formIsReady}
              >
                <Text style={styles.primaryBtnText}>Continue to Verification</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── STEP 2: Biometric verification ──────────────────── */}
      {currentStep === 'biometric' && (
        <View style={styles.bioContainer}>

          <Text style={styles.bioTitle}>VERIFY YOUR IDENTITY</Text>
          <Text style={styles.bioSubtitle}>
            Confirm who you are before saving your new password.
          </Text>

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

          {/* The big scan button */}
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

          {/* State-based status messages */}
          {scanState === 'idle' && (
            <Text style={styles.hintText}>
              {biometricMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
            </Text>
          )}
          {scanState === 'scanning' && (
            <Text style={styles.hintText}>Scanning…</Text>
          )}
          {scanState === 'failed' && (
            <View style={styles.failedSection}>
              <Text style={styles.errorText}>Scan failed — please try again.</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setScanState('idle')}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick switch between Face ID and fingerprint */}
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

        </View>
      )}
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
  },

  // Illustration
  illustrationWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.xl,
    marginBottom:   spacing.xl,
  },
  illustrationCircle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    borderWidth:     2,
    borderColor:     colors.border,
    backgroundColor: '#1a2540',
    alignItems:      'center',
    justifyContent:  'center',
  },
  refreshBadge: {
    position:        'absolute',
    bottom:          0,
    right:           -4,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.card,
    borderWidth:     2,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Form (step 1)
  form:       { width: '100%', maxWidth: 380, gap: spacing.md },
  fieldGroup: { gap: 6 },
  label:      { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  input: {
    width:             '100%',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   14,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
  },
  inputPadRight: { paddingRight: 48 },
  eyeBtn:        { position: 'absolute', right: 14, top: 14 },
  mismatchText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.error,
    marginTop:  2,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  btnDisabled:    { backgroundColor: colors.cardAlt },
  primaryBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },

  // Biometric (step 2)
  bioContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
  },
  bioTitle: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.lg,
    color:         colors.primary,
    letterSpacing: 1.5,
    textAlign:     'center',
  },
  bioSubtitle: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textMuted,
    textAlign:  'center',
    lineHeight: 20,
    maxWidth:   280,
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
  errorText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error, textAlign: 'center' },
  failedSection: { alignItems: 'center', gap: spacing.sm },
  retryBtn: {
    backgroundColor:   colors.card,
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingVertical:   12,
    paddingHorizontal: spacing.xl,
  },
  retryBtnText:   { fontFamily: fonts.bold, color: colors.textWhite, fontSize: fontSize.base },
  switchLinkText: {
    fontFamily:         fonts.regular,
    fontSize:           fontSize.sm,
    color:              colors.textMuted,
    textDecorationLine: 'underline',
  },
});
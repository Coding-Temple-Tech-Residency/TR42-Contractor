// PasswordResetScreen.tsx  —  Troy
// This screen has two steps:
//   Step 1 — The user enters their email + new password
//   Step 2 — They verify their identity with Face ID or fingerprint
//            before the password is actually saved
//
// Uses MainFrame header="default" with no footer nav since the user
// should not be navigating elsewhere mid-reset.
//
// Menu2 provides the back arrow and title via headerMenu prop.
// onBack steps back to the form on step 2 rather than leaving the
// screen — Menu2's back arrow only calls navigation.goBack().
//
// ── BIOMETRIC DEFAULT ─────────────────────────────────────────────────────────
// The biometric method is loaded from AsyncStorage on mount using the same
// key that ProfileScreen writes to, so the user's saved preference is always
// respected when step 2 opens.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons }      from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList }     from '../App';
import { MainFrame }              from '../components/MainFrame';
import { SETTINGS_BIOMETRIC_KEY } from './ProfileScreen';
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

  // Which step we're on
  const [currentStep, setCurrentStep] = useState('form');

  // Biometric state for step 2
  const [biometricMethod, setBiometricMethod] = useState('fingerprint');
  const [scanState,       setScanState]       = useState('idle');

  // Load the user's saved biometric preference from AsyncStorage on mount
  // so step 2 opens with the correct method pre-selected
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_BIOMETRIC_KEY);
        if (saved === 'face' || saved === 'fingerprint') {
          setBiometricMethod(saved);
        }
      } catch {
        // Fall back to fingerprint default
      }
    };
    load();
  }, []);

  const formIsReady =
    email.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleContinue = () => {
    if (!formIsReady) return;
    setCurrentStep('biometric');
  };

  const switchBiometricMethod = (method: string) => {
    setBiometricMethod(method);
    setScanState('idle');
  };

  const handleBiometricScan = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');

    // TODO: Replace with real expo-local-authentication call
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        Alert.alert(
          'Password Reset',
          'Your password has been updated successfully.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        setScanState('failed');
      }
    }, 1500);
  };

  // On step 2, back arrow returns to the form rather than leaving the screen
  const handleBackPress = () => {
    if (currentStep === 'biometric') {
      setCurrentStep('form');
      setScanState('idle');
    } else {
      navigation.goBack();
    }
  };

  return (
    <MainFrame
      header="default"
      headerMenu={['Menu2', ['Reset Password']]}
      footerMenu={['none', []]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── STEP 1: Password reset form ───────────────────────── */}
      {currentStep === 'form' && (
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Lock + refresh badge illustration */}
            <View style={styles.illustrationWrap}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="lock-closed" size={48} color={colors.textWhite} />
              </View>
              <View style={styles.refreshBadge}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </View>
            </View>

            <View style={styles.form}>

              {/* Email — label above, no placeholder text inside the box */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder=""
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="Email Address"
                />
              </View>

              {/* New Password — label above, no placeholder text */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View>
                  <TextInput
                    style={[styles.input, styles.inputPadRight]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder=""
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                    accessibilityLabel="New Password"
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

              {/* Confirm Password — label above, no placeholder text */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View>
                  <TextInput
                    style={[styles.input, styles.inputPadRight]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder=""
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    accessibilityLabel="Confirm Password"
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.mismatchText}>Passwords do not match</Text>
                )}
              </View>

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

      {/* ── STEP 2: Biometric verification ──────────────────────
          Opens with the method the user saved in Profile settings */}
      {currentStep === 'biometric' && (
        <View style={styles.bioContainer}>

          <Text style={styles.bioTitle}>VERIFY YOUR IDENTITY</Text>
          <Text style={styles.bioSubtitle}>
            Confirm who you are before saving your new password.
          </Text>

          {/* Method toggle — pre-selected from saved AsyncStorage preference */}
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
                name={biometricMethod === 'face' ? 'scan' : 'finger-print'}
                size={80}
                color={scanState === 'failed' ? colors.error : colors.primary}
              />
            )}
          </TouchableOpacity>

          {scanState === 'idle' && (
            <Text style={styles.hintText}>
              {biometricMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
            </Text>
          )}
          {scanState === 'scanning' && (
            <Text style={styles.hintText}>Scanning…</Text>
          )}

          {/* Failed state — retry only, no PIN option (this is a password reset, not login) */}
          {scanState === 'failed' && (
            <View style={styles.failedSection}>
              <Text style={styles.errorText}>Scan failed — please try again.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setScanState('idle')}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      )}
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  kav:        { flex: 1, width: '100%' },
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
  },

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
});
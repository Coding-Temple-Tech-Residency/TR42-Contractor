// OfflineLoginScreen.tsx  —  Troy
//
// This screen is the PIN entry fallback — reached when biometrics fail,
// whether the device is online or offline.
//
// Previous architecture had this screen containing its own biometric step,
// which caused the "goes back to biometrics" bug. That step has been removed.
// BiometricScreen.tsx now handles ALL biometric attempts (online and offline).
// This screen is purely: enter PIN → verify → go to Dashboard.
//
// Flow:
//   Login → BiometricCheck → (fail) → here (PIN entry)
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  DEV MODE
//
//  The dev PIN is set to "123456" for testing.
//  In production, replace the PIN check in handlePinLogin() with:
//    import * as SecureStore from 'expo-secure-store';
//    const savedPin = await SecureStore.getItemAsync('offlinePin');
//    if (pin !== savedPin) { setPinError('Incorrect PIN...'); return; }
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { Assets } from '../constants/Assets';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfflineLogin'>;

// DEV ONLY — replace with SecureStore lookup in production
const DEV_PIN = '123456';

// Amber — consistent with Login button and BiometricScreen throughout the app
const AMBER = '#f59e0b';

export default function OfflineLoginScreen() {
  const navigation = useNavigation<Nav>();

  const [pin,         setPin]         = useState('');
  const [showPin,     setShowPin]     = useState(false); // eye icon toggle
  const [pinError,    setPinError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only allow digits — strip anything else as the user types
  const handlePinChange = (newValue: string) => {
    const digitsOnly = newValue.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    setPinError(''); // clear error while typing
  };

  const handlePinLogin = async () => {
    // Validate before checking
    if (pin.length === 0) {
      setPinError('Please enter your 6-digit PIN.');
      return;
    }
    if (pin.length < 6) {
      setPinError(`PIN is too short — ${pin.length}/6 digits entered.`);
      return;
    }

    setIsSubmitting(true);

    // Small delay so the spinner is visible
    await new Promise(resolve => setTimeout(resolve, 600));

    // ── DEV: compare against hardcoded PIN ────────────────────────────────
    // In production replace with SecureStore lookup — see note at top of file
    if (pin !== DEV_PIN) {
      setPinError('Incorrect PIN. Please try again.');
      setIsSubmitting(false);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    navigation.replace('Inspection');
  };

  return (
    <ImageBackground
      source={Assets.backgrounds.MainFrame.MainbackgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header — no avatar, user isn't fully authenticated yet */}
        <FieldForceHeader showAvatar={false} />
        <SubHeader title="Enter PIN" />

        {/* KeyboardAvoidingView pushes the form up when the keyboard opens */}
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Keypad icon — visual indicator for what this screen is */}
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="keypad" size={52} color={AMBER} />
              </View>
            </View>

            {/* Explanation — tells the user why they're seeing this screen */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>PIN VERIFICATION</Text>
              <View style={styles.infoLine} />
              <Text style={styles.infoSub}>
                Biometric login failed. Enter your 6-digit PIN to continue.
              </Text>
              {/* DEV ONLY reminder — remove before production */}
              <Text style={styles.devNote}>Dev PIN: {DEV_PIN}</Text>
            </View>

            <View style={styles.form}>

              {/* PIN input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PIN Code</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.pinInput,
                      pinError ? styles.inputError : null,
                    ]}
                    value={pin}
                    onChangeText={handlePinChange}
                    placeholder="• • • • • •"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                  {/* Eye icon — toggles PIN visibility */}
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPin(!showPin)}
                  >
                    <Ionicons
                      name={showPin ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Error message — only shows when pinError has content */}
                {pinError !== '' && (
                  <View style={styles.fieldErrorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={styles.fieldErrorText}>{pinError}</Text>
                  </View>
                )}
              </View>

              {/* PIN length indicator dots — shows how many digits entered */}
              <View style={styles.dotsRow}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <View
                    key={i}
                    style={[styles.dot, pin.length >= i && styles.dotFilled]}
                  />
                ))}
              </View>

              {/* Verify PIN button — amber to match the rest of the app */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (pin.length < 6 || isSubmitting) && styles.submitBtnDisabled,
                ]}
                onPress={handlePinLogin}
                activeOpacity={0.85}
                disabled={pin.length < 6 || isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.submitRow}>
                    <Text style={styles.submitBtnText}>Verifying…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Verify PIN</Text>
                )}
              </TouchableOpacity>

              {/* Back to login — lets the user start over if needed */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.replace('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.backBtnText}>Back to Login</Text>
              </TouchableOpacity>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </ImageBackground>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container:       { flex: 1, backgroundColor: 'transparent' },
  kav:             { flex: 1, width: '100%' },
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
  },

  // ── Icon ─────────────────────────────────────────────────────────────────
  iconWrap: { marginTop: spacing.xl, marginBottom: spacing.md },
  iconCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth:     2,
    borderColor:     AMBER,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Info block ────────────────────────────────────────────────────────────
  infoBlock: { alignItems: 'center', marginBottom: spacing.lg },
  infoTitle: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.lg,
    color:         colors.textWhite,
    letterSpacing: 1.5,
  },
  infoLine: {
    width:           '70%',
    height:          2,
    backgroundColor: colors.textWhite,
    marginVertical:  6,
  },
  infoSub: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textLight,
    textAlign:  'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  // DEV ONLY — remove before production
  devNote: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.xs,
    color:         colors.warning,
    letterSpacing: 0.5,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
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
  // PIN input is centered with wide letter spacing to look like • • • • • •
  pinInput: {
    textAlign:     'center',
    letterSpacing: 8,
    paddingRight:  48, // room for eye icon
  },
  inputError: { borderColor: colors.error },
  inputRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:     { position: 'absolute', right: 14, top: 14 },

  fieldErrorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     2,
  },
  fieldErrorText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.error,
    flex:       1,
  },

  // ── PIN dot indicators ────────────────────────────────────────────────────
  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            10,
    marginTop:      spacing.xs,
  },
  dot: {
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: colors.border,
    borderWidth:     1,
    borderColor:     colors.textMuted,
  },
  dotFilled: {
    backgroundColor: AMBER,
    borderColor:     AMBER,
  },

  // ── Submit button — amber fill matches Login button ───────────────────────
  submitBtn: {
    backgroundColor: AMBER,
    borderRadius:    radius.md,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  submitBtnDisabled: { backgroundColor: colors.cardAlt },
  submitRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },

  // ── Back to login ─────────────────────────────────────────────────────────
  backBtn: {
    backgroundColor: colors.card,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingVertical: 14,
    alignItems:      'center',
  },
  backBtnText: {
    fontFamily: fonts.regular,
    color:      colors.textLight,
    fontSize:   fontSize.base,
  },
});
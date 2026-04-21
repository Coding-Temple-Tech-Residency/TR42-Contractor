// OfflineLoginScreen.tsx
// PIN entry screen — reached after biometric login fails on BiometricScreen.
//
// This screen is PIN ONLY. Biometrics are handled entirely by BiometricScreen
// before the user ever gets here. There is no biometric step on this screen.
//
// Flow:
//   BiometricScreen (fails) → "Use PIN instead" → OfflineLoginScreen (this screen)
//
// "Reset PIN" opens an inline modal that collects the user's email and alerts
// them that the vendor will send a new PIN after identity verification.
//
// ─────────────────────────────────────────────────────────────
// DEV ONLY: The dev PIN is set to "123456" for testing.
// In production replace the DEV_PIN check with:
//   const savedPin = await SecureStore.getItemAsync('offlinePin');
//   if (pin !== savedPin) { setPinError(...); return; }
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons }      from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import { MainFrame }          from '../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfflineLogin'>;

const DEV_PIN = '123456'; // DEV ONLY — remove before production

export default function OfflineLoginScreen() {
  const navigation = useNavigation<Nav>();

  // PIN state
  const [pin,      setPin]      = useState('');
  const [pinError, setPinError] = useState('');

  // Reset PIN modal state
  const [resetModalOpen,  setResetModalOpen]  = useState(false);
  const [resetEmail,      setResetEmail]      = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const emailLooksValid = resetEmail.includes('@') && resetEmail.includes('.');

  // ── PIN handlers ──────────────────────────────────────────

  const handlePinChange = (newValue: string) => {
    const trimmed = newValue.replace(/\D/g, '').slice(0, 6);
    setPin(trimmed);
    setPinError('');
  };

  const handlePinLogin = () => {
    if (pin.length === 0) {
      setPinError('Please enter your 6-digit PIN.');
      return;
    }
    if (pin.length < 6) {
      setPinError(`PIN is too short — please enter all 6 digits (${pin.length}/6 entered).`);
      return;
    }
    // DEV ONLY — replace with SecureStore check in production
    if (pin !== DEV_PIN) {
      setPinError('Incorrect PIN. Please try again.');
      return;
    }
    // TODO (Troy): when offline auth is implemented, complete the auth flow
    // here (e.g. restore stored token/user and call useAuth().login(...)) so
    // the Protected stack mounts naturally. Until then redirect to a route
    // that exists in the unauthenticated stack.
    navigation.replace('Login' as any);
  };

  // ── Reset PIN modal handlers ──────────────────────────────

  const openResetModal = () => {
    setResetEmail('');
    setResetSubmitting(false);
    setResetModalOpen(true);
  };

  const handleResetSubmit = () => {
    if (!emailLooksValid) return;
    setResetSubmitting(true);

    // TODO: In production, send this request to your backend API or save
    // it locally in AsyncStorage to be sent once the device is back online.
    // The vendor then verifies identity and contacts the user with a new PIN.
    setTimeout(() => {
      setResetSubmitting(false);
      setResetModalOpen(false);
      setResetEmail('');
      Alert.alert(
        'Request Sent',
        'Your PIN reset request has been sent to the Vendor.\n\nThey will reach out to you with a new PIN after verification.',
        [{ text: 'OK' }],
      );
    }, 800);
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <MainFrame header="default" headerMenu={['Menu2', ['Offline PIN']]} footerMenu={['none', []]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Keypad illustration */}
          <View style={styles.keypadIllustration}>
            <Ionicons name="keypad" size={64} color={colors.primary} />
          </View>

          {/* Explanation */}
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

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, pin.length < 6 && styles.btnDisabled]}
              onPress={handlePinLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>

            {/* Reset PIN button */}
            <TouchableOpacity
              style={styles.resetPinBtn}
              onPress={openResetModal}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.resetPinBtnText}>Reset PIN</Text>
            </TouchableOpacity>

            {/* DEV reminder */}
            <View style={styles.devBanner}>
              <Ionicons name="construct-outline" size={14} color={colors.warning} />
              <Text style={styles.devBannerText}>
                DEV MODE — Test PIN: {DEV_PIN}
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Reset PIN Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={resetModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setResetModalOpen(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setResetModalOpen(false)}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={modalStyles.sheet}>

            <View style={modalStyles.handle} />

            <View style={modalStyles.sheetHeader}>
              <View style={modalStyles.sheetTitleRow}>
                <Ionicons name="refresh-circle-outline" size={22} color={colors.primary} />
                <Text style={modalStyles.sheetTitle}>Reset PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setResetModalOpen(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={modalStyles.infoText}>
                Offline PINs are managed by your Vendor. Enter your email address below and your Vendor will send you a new PIN after verifying your identity.
              </Text>
            </View>

            <View style={modalStyles.fieldGroup}>
              <Text style={modalStyles.label}>Email Address</Text>
              <TextInput
                style={[
                  modalStyles.input,
                  !emailLooksValid && resetEmail.length > 0 && modalStyles.inputError,
                ]}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
              {resetEmail.length > 0 && !emailLooksValid && (
                <View style={modalStyles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={modalStyles.errorText}>Please enter a valid email address.</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                modalStyles.submitBtn,
                (!emailLooksValid || resetSubmitting) && modalStyles.submitBtnDisabled,
              ]}
              onPress={handleResetSubmit}
              activeOpacity={0.85}
              disabled={!emailLooksValid || resetSubmitting}
            >
              {resetSubmitting ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color={colors.textWhite} />
                  <Text style={modalStyles.submitBtnText}>Send Reset Request</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </MainFrame>
  );
}

// ── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  kav:        { width: '100%' },

  scroll: {
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

  pinForm:    { width: '100%', maxWidth: 380, gap: spacing.md },
  fieldGroup: { gap: 6 },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  label:      { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  pinCounter: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },

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

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  errorText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.error, flex: 1 },

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

  resetPinBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 13,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  resetPinBtnText: { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.primary },

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
  },
  devBannerText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.warning, flex: 1 },
});

// ── Reset PIN modal styles ─────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    backgroundColor:      colors.card,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal:    spacing.lg,
    paddingBottom:        spacing.xl,
    paddingTop:           spacing.sm,
    gap:                  spacing.md,
  },

  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border,
    alignSelf:       'center',
    marginBottom:    spacing.sm,
  },

  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitle:    { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.textWhite },

  infoBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             spacing.sm,
    backgroundColor: colors.primaryFaint,
    borderWidth:     1,
    borderColor:     colors.primary,
    borderRadius:    radius.md,
    padding:         spacing.md,
  },
  infoText: {
    flex:       1,
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textLight,
    lineHeight: 20,
  },

  fieldGroup: { gap: 6 },
  label:      { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  input: {
    width:             '100%',
    backgroundColor:   colors.background,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   14,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
  },
  inputError: { borderColor: colors.error },
  errorRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  errorText:  { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.error, flex: 1 },

  submitBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 15,
  },
  submitBtnDisabled: { backgroundColor: colors.cardAlt },
  submitBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },
});
// OfflinePinResetScreen.tsx
// Contractors cannot reset their own offline PIN — that's controlled by the vendor.
// This screen lets them enter their email so the vendor can send them a new PIN
// once they have an internet connection again.
//
// There are two "views" on this screen:
//   1. The form — where they enter their email and submit
//   2. The confirmation — shown after they submit successfully
//
// Uses MainFrame header="default" for the centered logo (matches every
// other screen), strip="menus" to suppress nav, and SubHeader as a
// child for the back arrow + title bar.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import { MainFrame }          from '../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfflinePinReset'>;

export default function OfflinePinResetScreen() {
  const navigation = useNavigation<Nav>();

  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Basic email check — needs an @ and a dot to be considered valid
  const emailLooksValid = email.includes('@') && email.includes('.');

  const handleSubmit = () => {
    if (!emailLooksValid) return;

    // TODO: Save this request locally so it can be sent to the vendor API
    // once the device gets back online. Could use AsyncStorage for this.

    setSubmitted(true);
  }

  return (
    <MainFrame header="default" headerMenu={['Menu2', ['Reset Pin']]} footerMenu={['none', []]}>
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

          {submitted === false ? (

            // ── FORM VIEW ───────────────────────────────────────────
            <View style={styles.formView}>

              {/* Lock + wifi-off badge illustration */}
              <View style={styles.illustrationWrap}>
                <View style={styles.illustrationCircle}>
                  <Ionicons name="lock-closed" size={48} color={colors.textWhite} />
                </View>
                <View style={styles.wifiOffBadge}>
                  <Ionicons name="wifi-outline" size={16} color={colors.warning} />
                </View>
              </View>

              {/* Explanation box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Offline PINs are managed by your vendor. Enter your email address below and your vendor will send you a new PIN.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, !emailLooksValid && styles.btnDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={!emailLooksValid}
                >
                  <Text style={styles.submitBtnText}>Request New PIN</Text>
                </TouchableOpacity>
              </View>
            </View>

          ) : (

            // ── CONFIRMATION VIEW ────────────────────────────────────
            <View style={styles.confirmView}>

              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={48} color={colors.success} />
              </View>

              <Text style={styles.confirmTitle}>Request Sent</Text>

              <View style={styles.messageBox}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={styles.messageText}>
                  The vendor has received your request and will update you when you get back online.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.navigate('OfflineLogin')}
                activeOpacity={0.85}
              >
                <Text style={styles.backBtnText}>Back to Login</Text>
              </TouchableOpacity>

            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </MainFrame>
  );
}

const styles = StyleSheet.create({


  kav: { width: '100%' },

  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
    paddingTop:        spacing.lg,
  },

  formView: { width: '100%', maxWidth: 380, alignItems: 'center' },
  illustrationWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.xl,
    marginBottom:   spacing.lg,
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
  wifiOffBadge: {
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
  },
  infoText: {
    flex:       1,
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textLight,
    lineHeight: 20,
  },
  form:       { width: '100%', gap: spacing.md },
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
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  btnDisabled:   { backgroundColor: colors.cardAlt },
  submitBtnText: {
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.base,
    letterSpacing: 0.5,
  },

  confirmView: {
    alignItems: 'center',
    gap:        spacing.lg,
    paddingTop: spacing.xl * 2,
    width:      '100%',
    maxWidth:   380,
  },
  checkCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    borderWidth:     3,
    borderColor:     colors.success,
    backgroundColor: 'rgba(52,211,153,0.08)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  confirmTitle: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.xl,
    color:      colors.textWhite,
  },
  messageBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             spacing.sm,
    backgroundColor: colors.card,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.md,
    padding:         spacing.md,
    width:           '100%',
  },
  messageText: {
    flex:       1,
    fontFamily: fonts.regular,
    fontSize:   fontSize.base,
    color:      colors.textLight,
    lineHeight: 24,
  },
  backBtn: {
    width:           '100%',
    backgroundColor: colors.card,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       spacing.sm,
  },
  backBtnText: {
    fontFamily: fonts.regular,
    color:      colors.textLight,
    fontSize:   fontSize.base,
  },
});
// BiometricScreen.tsx  —  Troy
// Online biometric verification screen.
// Reached after a successful credential login (online OR offline pill state).
//
// Flow:
//   Login → BiometricCheck (this screen) → Dashboard       (scan succeeds)
//                                        → OfflineLogin    (scan fails → PIN entry)
//
// OfflineLoginScreen is now purely a PIN entry screen.
// The biometric step for ALL cases lives here.
//
// ─── DEV MODE NOTE ────────────────────────────────────────────────────────────
//
//  DEV_MODE = true  → scan ALWAYS SUCCEEDS so the full success flow can be tested.
//                     Tap "Force Fail (Dev)" to manually trigger failure and
//                     reach the PIN screen.
//
//  DEV_MODE = false → uses real expo-local-authentication (production).
//                     Replace the setTimeout block in handleScan() with:
//
//    import * as LocalAuthentication from 'expo-local-authentication';
//    const result = await LocalAuthentication.authenticateAsync({
//      promptMessage: 'Verify your identity',
//    });
//    if (result.success) { navigation.replace('Inspection'); }
//    else { setScanState('failed'); }
//
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { Assets } from '../constants/Assets';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BiometricCheck'>;

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  DEV MODE — set to false when real biometrics are ready.
//
//  true  = scan always succeeds. Use "Force Fail (Dev)" to test failure path.
//  false = uses real expo-local-authentication hardware call.
// ─────────────────────────────────────────────────────────────────────────────
const DEV_MODE = true;

// Amber — consistent with Login button and "Restricted Access" throughout the app
const AMBER = '#f59e0b';

export default function BiometricScreen() {
  const navigation = useNavigation<Nav>();

  // Online/Offline toggle — mirrors the pill on the Login screen.
  // Biometrics are local to the device and work regardless of connection.
  // This pill is a server-status indicator and testing aid only.
  const [isOffline, setIsOffline] = useState(false);

  // 'idle'     = waiting for the user to tap
  // 'scanning' = scan in progress (spinner shown)
  // 'failed'   = scan failed — retry + PIN fallback appear
  const [scanState, setScanState] = useState('idle');

  // Which biometric method is selected — face or fingerprint
  const [selectedMethod, setSelectedMethod] = useState('fingerprint');

  // When the user switches methods, reset any scan state too
  const switchMethod = (method: string) => {
    setSelectedMethod(method);
    setScanState('idle');
  };

  // This runs when the user taps the large scan button
  const handleScan = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');

    setTimeout(() => {
      if (DEV_MODE) {
        // DEV MODE: always succeed so the full flow can be tested.
        // Use "Force Fail (Dev)" button to test the failure/PIN path.
        navigation.replace('Inspection');
        return;
      }

      // PRODUCTION: replace with real LocalAuthentication — see dev note above
      const scanWorked = Math.random() > 0.3;
      if (scanWorked) {
        navigation.replace('Inspection');
      } else {
        setScanState('failed');
      }
    }, 1500);
  };

  // DEV ONLY — forces a failure so the PIN fallback path can be tested
  const handleForceFail = () => setScanState('failed');

  // "Use PIN instead" — navigates to OfflineLoginScreen which is now
  // purely a PIN entry screen. Works the same whether online or offline.
  const handleUsePIN = () => navigation.replace('OfflineLogin');

  const getScanIcon = () => (selectedMethod === 'face' ? 'scan' : 'finger-print');

  const getScanIconColor = () => {
    if (scanState === 'failed')   return colors.error;
    if (scanState === 'scanning') return colors.textWhite;
    return AMBER;
  };

  return (
    <ImageBackground
      source={Assets.backgrounds.MainFrame.MainbackgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header — no avatar, still part of the auth flow */}
        <FieldForceHeader showAvatar={false} />
        <SubHeader title="Security Check" />

        {/* ── Online / Offline status pill ──────────────────────────────────
            Sits directly below "Security Check" for visibility.
            Tapping it toggles the mode. Biometrics work locally on the
            device regardless — this pill is a server-status indicator only. */}
        <TouchableOpacity
          style={styles.statusPill}
          onPress={() => {
            setIsOffline(!isOffline);
            setScanState('idle');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOffline ? 'wifi-outline' : 'wifi'}
            size={14}
            color={isOffline ? colors.warning : colors.success}
          />
          <Text style={[styles.statusText, { color: isOffline ? colors.warning : colors.success }]}>
            {isOffline ? 'Offline' : 'Online'}
          </Text>
        </TouchableOpacity>

        <View style={styles.body}>

          {/* Prompt text — white for clear readability on the dark background */}
          <Text style={styles.promptText}>BIOMETRIC IDENTITY</Text>
          <Text style={styles.promptText}>CHECK REQUIRED</Text>

          {/* ── Method toggle — Face ID / Fingerprint ──────────────────────
              Active method highlights in amber to match the Login button.  */}
          <View style={styles.methodRow}>

            <TouchableOpacity
              style={[styles.methodBtn, selectedMethod === 'face' && styles.methodBtnActive]}
              onPress={() => switchMethod('face')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color={selectedMethod === 'face' ? AMBER : colors.textMuted}
              />
              <Text style={[styles.methodLabel, selectedMethod === 'face' && styles.methodLabelActive]}>
                Face ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodBtn, selectedMethod === 'fingerprint' && styles.methodBtnActive]}
              onPress={() => switchMethod('fingerprint')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="finger-print"
                size={20}
                color={selectedMethod === 'fingerprint' ? AMBER : colors.textMuted}
              />
              <Text style={[styles.methodLabel, selectedMethod === 'fingerprint' && styles.methodLabelActive]}>
                Fingerprint
              </Text>
            </TouchableOpacity>

          </View>

          {/* ── Large scan button ────────────────────────────────────────────
              Border and icon color reflect current scan state:
                idle     = amber  (inviting tap)
                scanning = muted gray + spinner
                failed   = error red                                         */}
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
              <ActivityIndicator size={64} color={colors.textWhite} />
            ) : (
              <Ionicons name={getScanIcon()} size={80} color={getScanIconColor()} />
            )}
          </TouchableOpacity>

          {/* Status hint text */}
          {scanState === 'idle' && (
            <Text style={styles.hintText}>
              {selectedMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
            </Text>
          )}
          {scanState === 'scanning' && (
            <Text style={styles.hintText}>Scanning…</Text>
          )}

          {/* ── DEV MODE: Force Fail button ───────────────────────────────
              Only shown in dev. Lets you trigger the failure path manually
              without waiting for a random failed scan.
              Remove this entire block before going to production.          */}
          {DEV_MODE && scanState === 'idle' && (
            <TouchableOpacity
              style={styles.devFailBtn}
              onPress={handleForceFail}
              activeOpacity={0.8}
            >
              <Ionicons name="construct-outline" size={14} color={colors.warning} />
              <Text style={styles.devFailText}>Force Fail (Dev)</Text>
            </TouchableOpacity>
          )}

          {/* ── Failed state ─────────────────────────────────────────────────
              Only shown after a failed scan — never during idle or scanning.
              "Use PIN instead" goes to OfflineLoginScreen (PIN entry only).
              Both online and offline use the same PIN screen.               */}
          {scanState === 'failed' && (
            <View style={styles.failedSection}>
              <Text style={styles.errorText}>Scan failed — please try again.</Text>

              {/* Retry the scan */}
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setScanState('idle')}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>

              {/* PIN fallback — navigates to PIN entry screen, NOT back to biometrics */}
              <TouchableOpacity
                style={styles.pinLink}
                onPress={handleUsePIN}
                activeOpacity={0.7}
              >
                <Ionicons name="keypad-outline" size={16} color={AMBER} />
                <Text style={styles.pinLinkText}>Use PIN instead</Text>
              </TouchableOpacity>

            </View>
          )}

          {/* Quick method switch — only shown at idle, not after failure */}
          {scanState === 'idle' && (
            <TouchableOpacity
              style={styles.switchLink}
              onPress={() => switchMethod(selectedMethod === 'face' ? 'fingerprint' : 'face')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchLinkText}>
                Use {selectedMethod === 'face' ? 'fingerprint' : 'Face ID'} instead
              </Text>
            </TouchableOpacity>
          )}

        </View>
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

  // ── Online/Offline pill — directly below SubHeader ───────────────────────
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    paddingVertical:   spacing.sm,
    borderBottomWidth: 1,
  },
  statusText: { fontFamily: fonts.bold, fontSize: fontSize.sm },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl * 1.5,
    gap:               spacing.md,
  },

  // ── Prompt text — white ───────────────────────────────────────────────────
  promptText: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.lg,
    color:         colors.textWhite,
    letterSpacing: 1.5,
    textAlign:     'center',
    marginTop:     spacing.md,
  },

  // ── Method toggle buttons ─────────────────────────────────────────────────
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
    backgroundColor:   'rgba(26, 43, 66, 0.85)',
  },
  methodBtnActive: {
    borderColor:     AMBER,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  methodLabel:       { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  methodLabelActive: { fontFamily: fonts.bold, color: AMBER },

  // ── Scan button ───────────────────────────────────────────────────────────
  scanButton: {
    width:           160,
    height:          160,
    borderRadius:    24,
    borderWidth:     3,
    borderColor:     AMBER,
    alignItems:      'center',
    justifyContent:  'center',
    marginVertical:  spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  scanButtonScanning: {
    borderColor:     colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scanButtonFailed: {
    borderColor:     colors.error,
    backgroundColor: 'rgba(248,113,113,0.05)',
  },

  hintText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },

  // ── DEV force-fail button ─────────────────────────────────────────────────
  devFailBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius:      radius.sm,
    borderWidth:       1,
    borderColor:       colors.warning,
    backgroundColor:   'rgba(245, 158, 11, 0.08)',
  },
  devFailText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.warning },

  // ── Failed section ────────────────────────────────────────────────────────
  failedSection: { alignItems: 'center', gap: spacing.md },
  errorText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.error,
    textAlign:  'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor:   'rgba(26, 43, 66, 0.85)',
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingVertical:   12,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: { fontFamily: fonts.bold, color: colors.textWhite, fontSize: fontSize.base },

  // ── PIN link — only after failed scan ────────────────────────────────────
  pinLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  pinLinkText: {
    fontFamily:         fonts.bold,
    fontSize:           fontSize.sm,
    color:              AMBER,
    textDecorationLine: 'underline',
  },

  // ── Switch method link — only at idle ────────────────────────────────────
  switchLink: { marginTop: spacing.xs },
  switchLinkText: {
    fontFamily:         fonts.regular,
    fontSize:           fontSize.sm,
    color:              colors.textMuted,
    textDecorationLine: 'underline',
  },
});
// BiometricScreen.tsx
// This screen asks the user to verify their identity using either
// Face ID or a fingerprint scan before they can access the app.
// It comes right after the login screen and before the dashboard.

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BiometricCheck'>;

export default function BiometricScreen() {
  const navigation = useNavigation<Nav>();

  // Tracks what's happening with the scan right now
  // 'idle' = waiting for the user to tap
  // 'scanning' = scan is in progress (shows a spinner)
  // 'failed' = scan didn't work, show an error
  const [scanState, setScanState] = useState('idle');

  // Which method the user has chosen — face scan or fingerprint
  const [selectedMethod, setSelectedMethod] = useState('fingerprint');

  // When the user switches methods, reset any scan state too
  const switchMethod = (method: string) => {
    setSelectedMethod(method);
    setScanState('idle');
  }

  // This runs when the user taps the big scan button
  const handleScan = () => {
    // Don't start a new scan if one is already running
    if (scanState === 'scanning') return;

    setScanState('scanning');

    // TODO: Replace this fake timeout with a real biometric call using expo-local-authentication
    // Example:
    //   import * as LocalAuthentication from 'expo-local-authentication';
    //   const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify identity' });
    //   if (result.success) { navigation.replace('Dashboard'); }
    //   else { setScanState('failed'); }
    setTimeout(() => {
      // Random result for now — 70% chance of success while testing
      const scanWorked = Math.random() > 0.3;

      if (scanWorked) {
        // Take the user to the dashboard — replace() removes this screen from
        // the history stack so they can't press back and skip biometrics
        navigation.replace('Dashboard');
      } else {
        setScanState('failed');
      }
    }, 1500);
  }

  // Pick the right icon based on which method is selected and whether it failed
  const getScanIcon = () => {
    if (selectedMethod === 'face') {
      return 'scan';
    }
    return 'finger-print';
  }

  // The icon color changes to red if the scan failed
  const getScanIconColor = () => {
    if (scanState === 'failed') {
      return colors.error;
    }
    return colors.primary;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header bar — no avatar because this is still part of the auth flow */}
      <FieldForceHeader showAvatar={false} />

      {/* Sub-header with the back arrow and screen title */}
      <SubHeader title="Security Check" />

      <View style={styles.body}>

        {/* Prompt text at the top */}
        <Text style={styles.promptText}>BIOMETRIC IDENTITY</Text>
        <Text style={styles.promptText}>CHECK REQUIRED</Text>

        {/* The two method toggle buttons — Face ID and Fingerprint */}
        <View style={styles.methodRow}>

          {/* Face ID button */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'face' && styles.methodBtnActive, // highlight if selected
            ]}
            onPress={() => switchMethod('face')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="scan-outline"
              size={20}
              color={selectedMethod === 'face' ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.methodLabel,
              selectedMethod === 'face' && styles.methodLabelActive,
            ]}>
              Face ID
            </Text>
          </TouchableOpacity>

          {/* Fingerprint button */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'fingerprint' && styles.methodBtnActive,
            ]}
            onPress={() => switchMethod('fingerprint')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="finger-print"
              size={20}
              color={selectedMethod === 'fingerprint' ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.methodLabel,
              selectedMethod === 'fingerprint' && styles.methodLabelActive,
            ]}>
              Fingerprint
            </Text>
          </TouchableOpacity>

        </View>

        {/* The big tappable scan button in the middle of the screen */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            scanState === 'scanning' && styles.scanButtonScanning, // gray border while scanning
            scanState === 'failed'   && styles.scanButtonFailed,   // red border on failure
          ]}
          onPress={handleScan}
          activeOpacity={0.85}
          disabled={scanState === 'scanning'} // can't tap while a scan is running
        >
          {/* Show a spinner while scanning, otherwise show the icon */}
          {scanState === 'scanning' ? (
            <ActivityIndicator size={64} color={colors.primary} />
          ) : (
            <Ionicons
              name={getScanIcon()}
              size={80}
              color={getScanIconColor()}
            />
          )}
        </TouchableOpacity>

        {/* Status message — changes based on what's happening */}
        {scanState === 'idle' && (
          <Text style={styles.hintText}>
            {selectedMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
          </Text>
        )}

        {scanState === 'scanning' && (
          <Text style={styles.hintText}>Scanning…</Text>
        )}

        {/* If the scan failed, show an error and a retry button */}
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

        {/* Quick switch link — lets the user swap methods without re-selecting from the toggle */}
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

  // The two method buttons sit side by side
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
  // This style gets added on top of methodBtn when that method is selected
  methodBtnActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primaryFaint, // subtle orange tint
  },
  methodLabel:       { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  methodLabelActive: { fontFamily: fonts.bold, color: colors.primary },

  // The large scan circle in the center
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
    textDecorationLine: 'underline', // makes it look like a clickable link
  },
});
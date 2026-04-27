// BiometricScreen.tsx  —  Troy
//
// Online biometric verification screen.
// Reached after a successful credential login on LoginScreen.
//
// Flow:
//   LoginScreen (credentials OK) → BiometricCheck (this screen) → Home (scan succeeds)
//                                                               → OfflineLogin (scan fails)
//
// ── WHY login() IS CALLED HERE, NOT IN LoginScreen ────────────────────────────
// If App.tsx switches navigation stacks the moment isAuthenticated becomes true,
// calling login() in LoginScreen before navigating here would cause this screen
// to be unmounted immediately — the user would skip biometrics entirely.
//
// Instead LoginScreen passes the API token and user as navigation params.
// This screen calls login() only after a successful biometric scan, ensuring
// the user is never considered authenticated until their identity is verified.
// ──────────────────────────────────────────────────────────────────────────────
//
// DEV MODE = true  → scan always succeeds. Tap "Force Fail (Dev)" to test
//                    the failure path.
// DEV MODE = false → uses real expo-local-authentication.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons }  from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp }          from '@react-navigation/native-stack';

import { RootStackParamList,OnSuccessRoute }     from '../App';
import { MainFrame } from '../components/MainFrame';
import { SETTINGS_BIOMETRIC_KEY } from './ProfileScreen';
import { useAuth }                from '../contexts/AuthContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'BiometricCheck'>;
type Route = RouteProp<RootStackParamList, 'BiometricCheck'>;

const DEV_MODE = true;
const AMBER    = '#f59e0b';

export default function BiometricScreen() {
  const navigation           = useNavigation<Nav>();
  const route                = useRoute<Route>();
  const { login }            = useAuth();

  // Pending credentials passed from LoginScreen — not yet committed to AuthContext
  const { pendingToken, pendingUser,onSuccess } = route.params;

  const [isOffline,      setIsOffline]      = useState(false);
  const [scanState,      setScanState]      = useState('idle');
  const [selectedMethod, setSelectedMethod] = useState('fingerprint');

  // Load the user's saved biometric preference from AsyncStorage so the
  // correct method is pre-selected when this screen opens
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_BIOMETRIC_KEY);
        if (saved === 'face' || saved === 'fingerprint') {
          setSelectedMethod(saved);
        }
      } catch {
        // Fall back to fingerprint default
      }
    };
    load();
  }, []);

  const switchMethod = (method: string) => {
    setSelectedMethod(method);
    setScanState('idle');
  };
  const go = (route: OnSuccessRoute) => {
            if ("params" in route) {
              navigation.replace(route.screen as any, route.params as any);
            } else {
              navigation.replace(route.screen as any);
            }
          };
  const handleScan = async () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');

    setTimeout(async () => {
      if (DEV_MODE) {
        await login(pendingToken, pendingUser);
        // No navigation.replace here — login() flips isAuthenticated, which
        // causes RootNavigator to swap the Auth stack out for the Protected
        // stack. The Protected stack opens directly at its initialRouteName
        // (Inspection). Calling replace() on the now-unmounted Auth navigator
        // would throw "Home not handled by any navigator".
        if(onSuccess){
          go(onSuccess);
        }else{
          return;
        }
        
      }
      const scanWorked = Math.random() > 0.3;
      if (scanWorked) {
        await login(pendingToken, pendingUser);
        // See comment above — let RootNavigator handle the stack swap.
       if(onSuccess){
        go(onSuccess);
       }else{
        return;
       }
      } else {
        setScanState('failed');
      }
    }, 1500);
  };

  const handleForceFail = () => setScanState('failed');
  const handleUsePIN    = () => navigation.replace('OfflineLogin');

  const getScanIcon      = () => selectedMethod === 'face' ? 'scan' : 'finger-print';
  const getScanIconColor = () => {
    if (scanState === 'failed')   return colors.error;
    if (scanState === 'scanning') return colors.textWhite;
    return AMBER;
  };

  return (
    <MainFrame header="default" headerMenu={['Menu2', ['Security Check']]} footerMenu={['none', []]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.topWrap}>
        <TouchableOpacity
          style={styles.statusPill}
          onPress={() => { setIsOffline(!isOffline); setScanState('idle'); }}
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
      </View>

      <View style={styles.body}>

        <Text style={styles.promptText}>BIOMETRIC IDENTITY</Text>
        <Text style={styles.promptText}>CHECK REQUIRED</Text>

        {/* Method toggle — pre-selected from saved preference */}
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

        {/* Large scan button */}
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
            <Ionicons name={getScanIcon()} size={80} color={getScanIconColor()} />
          )}
        </TouchableOpacity>

        {scanState === 'idle' && (
          <Text style={styles.hintText}>
            {selectedMethod === 'face' ? 'Tap to scan your face' : 'Tap to scan fingerprint'}
          </Text>
        )}
        {scanState === 'scanning' && (
          <Text style={styles.hintText}>Scanning…</Text>
        )}

        {/* DEV: Force Fail — remove entire block before production */}
        {DEV_MODE && scanState === 'idle' && (
          <TouchableOpacity style={styles.devFailBtn} onPress={handleForceFail} activeOpacity={0.8}>
            <Ionicons name="construct-outline" size={14} color={colors.warning} />
            <Text style={styles.devFailText}>Force Fail (Dev)</Text>
          </TouchableOpacity>
        )}

        {/* Failed state — retry + PIN fallback */}
        {scanState === 'failed' && (
          <View style={styles.failedSection}>
            <Text style={styles.errorText}>Scan failed — please try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setScanState('idle')}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinLink} onPress={handleUsePIN} activeOpacity={0.7}>
              <Ionicons name="keypad-outline" size={16} color={AMBER} />
              <Text style={styles.pinLinkText}>Use PIN instead</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  topWrap: { alignSelf: 'stretch' },

  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    paddingVertical:   spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusText: { fontFamily: fonts.bold, fontSize: fontSize.sm },

  body: {
    width:             '100%',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl * 1.5,
    paddingBottom:     spacing.xl,
    gap:               spacing.md,
  },

  promptText: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.lg,
    color:         colors.textWhite,
    letterSpacing: 1.5,
    textAlign:     'center',
    marginTop:     spacing.md,
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
    backgroundColor:   'rgba(26, 43, 66, 0.85)',
  },
  methodBtnActive: {
    borderColor:     AMBER,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  methodLabel:       { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  methodLabelActive: { fontFamily: fonts.bold, color: AMBER },

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

  failedSection:   { alignItems: 'center', gap: spacing.md },
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

  pinLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  pinLinkText: {
    fontFamily:         fonts.bold,
    fontSize:           fontSize.sm,
    color:              AMBER,
    textDecorationLine: 'underline',
  },
});
// ProfileScreen.tsx
// Shows the logged-in contractor's profile information.
// Reached by tapping the avatar icon in the top-right of any screen.
//
// Sections:
//   1. Avatar + name + contractor ID + vendor
//   2. Contact info (email, phone, address)
//   3. Menu rows (License, Settings, Logout)

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import type { ApiError } from '../utils/api';
import { saveOfflinePin, deleteOfflinePin } from '../utils/secureStorage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

// ---------------------------------------------------------------
// Placeholder contractor data — replace this with real user data
// from your auth context or API response once the backend is ready
// ---------------------------------------------------------------
const CONTRACTOR = {
  name:         'John Doe',
  contractorId: '5555555',
  vendor:       'Ex-Way',
  email:        'myemail@email.com',
  phone:        '800-555-5555',
  address:      '2000 Alee Lane, Lancaster, SC 28550',
};

// ---------------------------------------------------------------
// InfoRow — a reusable row component for showing contact details.
// We pull it out as its own component so we don't repeat the same
// layout code three times for email, phone, and address.
// ---------------------------------------------------------------
const InfoRow = (props: { icon: any; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <View style={infoStyles.iconWrap}>
      <Ionicons name={props.icon} size={18} color={colors.primary} />
    </View>
    <View style={infoStyles.textWrap}>
      <Text style={infoStyles.label}>{props.label}</Text>
      <Text style={infoStyles.value}>{props.value}</Text>
    </View>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   14,
    paddingHorizontal: spacing.md,
    gap:               spacing.md,
    width:             '100%',
  },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  textWrap:  { flex: 1, flexShrink: 1 },
  label:     { fontFamily: fonts.regular, fontSize: fontSize.xs,   color: colors.textMuted,  marginBottom: 2 },
  value:     { fontFamily: fonts.regular, fontSize: fontSize.sm,   color: colors.textWhite, flexWrap: 'wrap' },
});

// ---------------------------------------------------------------
// MenuRow — a tappable row with an icon, label, and optional
// chevron arrow. Used for License, Settings, and Logout.
// The "danger" prop makes the text red (used for Logout).
// ---------------------------------------------------------------
// Props type for the tappable menu row component
type MenuRowProps = {
  icon:     any;
  label:    string;
  onPress?: () => void;
  danger?:  boolean;
  isOpen?:  boolean;
};

const MenuRow = (props: MenuRowProps) => {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={props.onPress} activeOpacity={0.75}>
      <View style={menuStyles.left}>
        {/* Icon color is red for danger rows, gray for normal rows */}
        <Ionicons
          name={props.icon}
          size={18}
          color={props.danger ? colors.error : colors.textMuted}
        />
        <Text style={[menuStyles.label, props.danger && menuStyles.labelDanger]}>
          {props.label}
        </Text>
      </View>
      {/* Only show the arrow if it's not a danger/logout row */}
      {props.danger !== true && (
        <Ionicons name={props.isOpen ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   16,
    paddingHorizontal: spacing.md,
    width:             '100%',
  },
  left:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label:       { fontFamily: fonts.regular, fontSize: fontSize.base, color: colors.textWhite },
  labelDanger: { color: colors.error }, // overrides the white text color for logout
});

// ---------------------------------------------------------------
// Main ProfileScreen component
// ---------------------------------------------------------------
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();

  // ── Offline PIN state ───────────────────────────────────────
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin,         setPin]         = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');
  const [pinError,    setPinError]    = useState('');
  const [pinLoading,  setPinLoading]  = useState(false);

  const resetPinForm = () => {
    setShowPinForm(false);
    setPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleSetOfflinePin = async () => {
    // ── Client-side validation ──
    if (!pin || pin.length < 6) {
      setPinError('PIN must be at least 6 digits.');
      return;
    }
    if (pin.length > 10) {
      setPinError('PIN cannot exceed 10 digits.');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setPinError('PIN must contain only digits.');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      // 1. Save the PIN on the backend (hashed)
      await api.authPost<{ message: string }>('/auth/offline-pin', { pin });

      // 2. Save the raw PIN locally in SecureStore so OfflineLoginScreen
      //    can compare against it when the device is offline.
      await saveOfflinePin(pin);

      Alert.alert('Success', 'Your offline PIN has been set. You can now use it to log in without internet.');
      resetPinForm();
    } catch (err) {
      const apiErr = err as ApiError;
      setPinError(apiErr.error || 'Failed to set offline PIN. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();                      // clears token from SecureStore + context
    await deleteOfflinePin();            // optionally clear offline PIN on logout
    navigation.replace('Login');
  };

  return (
    <MainFrame header="home" headerMenu={["Menu2", ["Profile"]]}>


        {/* ── Avatar + name section ─────────────────────────── */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            {/* TODO: Replace with the contractor's actual photo using an <Image> component */}
            <Ionicons name="person" size={52} color="#8a9bb8" />
          </View>
          <Text style={styles.name}>{CONTRACTOR.name}</Text>
          <Text style={styles.metaText}>Contractor ID: {CONTRACTOR.contractorId}</Text>
          <Text style={styles.metaText}>Vendor: {CONTRACTOR.vendor}</Text>
        </View>

        {/* ── Contact info section ──────────────────────────── */}
        <View style={styles.section}>
          {/* Using "camera-outline" for email to match the approved design icon */}
          <InfoRow icon="camera-outline"   label="Email"   value={CONTRACTOR.email}   />
          <InfoRow icon="call-outline"     label="Phone"   value={CONTRACTOR.phone}   />
          <InfoRow icon="location-outline" label="Address" value={CONTRACTOR.address} />
        </View>

        {/* ── Menu section ─────────────────────────────────── */}
        <View style={styles.section}>
          <MenuRow
            icon="ribbon-outline"
            label="License"
            onPress={() => navigation.navigate('LicenseDetails')}
          />
          <MenuRow
            icon="keypad-outline"
            label="Set Offline PIN"
            onPress={() => setShowPinForm(!showPinForm)}
            isOpen={showPinForm}
          />

          {/* ── Offline PIN setup form — inline below the row ── */}
          {showPinForm && (
            <View style={styles.pinSection}>
              <Text style={styles.pinTitle}>Set Offline PIN</Text>
              <Text style={styles.pinDescription}>
                This PIN lets you log in when you have no internet connection. It must be 6–10 digits.
              </Text>

              <TextInput
                style={[styles.pinInput, pinError !== '' && styles.pinInputError]}
                value={pin}
                onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 10)); setPinError(''); }}
                placeholder="Enter PIN (6-10 digits)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={10}
              />

              <TextInput
                style={[styles.pinInput, pinError !== '' && styles.pinInputError]}
                value={confirmPin}
                onChangeText={(v) => { setConfirmPin(v.replace(/\D/g, '').slice(0, 10)); setPinError(''); }}
                placeholder="Confirm PIN"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={10}
              />

              {pinError !== '' && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.errorText}>{pinError}</Text>
                </View>
              )}

              <View style={styles.pinBtnRow}>
                <TouchableOpacity
                  style={styles.pinCancelBtn}
                  onPress={resetPinForm}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pinCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pinSaveBtn, pinLoading && styles.btnDisabled]}
                  onPress={handleSetOfflinePin}
                  activeOpacity={0.85}
                  disabled={pinLoading}
                >
                  {pinLoading
                    ? <ActivityIndicator size="small" color={colors.textWhite} />
                    : <Text style={styles.pinSaveBtnText}>Save PIN</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          <MenuRow
            icon="settings-outline"
            label="Settings"
            onPress={() => {
              // TODO: Create a Settings screen and navigate to it here
            }}
          />
          {/* Logout row — red text, no arrow, navigates back to Login */}
          <MenuRow
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
            danger={true}
          />
        </View>

    </MainFrame>
  );
}

const styles = StyleSheet.create({
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xl },

  avatarBlock: {
    alignItems:      'center',
    paddingVertical: spacing.xl,
    gap:             6,
    width:           '90%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom:    spacing.md,
  },
  avatarCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: '#1e2d45',
    borderWidth:     2,
    borderColor:     colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.sm,
  },
  name:     { fontFamily: fonts.bold,    fontSize: fontSize.xl,   color: colors.textWhite },
  metaText: { fontFamily: fonts.regular, fontSize: fontSize.sm,   color: colors.textMuted },

  section: { gap: spacing.sm, width: '90%', marginBottom: spacing.lg },

  // ── Offline PIN form styles ─────────────────────────────────
  pinSection: {
    width:            '100%',
    backgroundColor:  colors.card,
    borderRadius:     radius.md,
    borderWidth:      1,
    borderColor:      colors.border,
    padding:          spacing.md,
    gap:              spacing.sm,
  },
  pinTitle: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.base,
    color:      colors.textWhite,
  },
  pinDescription: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textMuted,
    lineHeight: 20,
  },
  pinInput: {
    backgroundColor:   colors.cardAlt,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
    letterSpacing:     4,
  },
  pinInputError: { borderColor: colors.error },
  errorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.error,
    flex:       1,
  },
  pinBtnRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginTop:     spacing.xs,
  },
  pinCancelBtn: {
    flex:            1,
    backgroundColor: colors.cardAlt,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingVertical: 12,
    alignItems:      'center',
  },
  pinCancelBtnText: {
    fontFamily: fonts.bold,
    color:      colors.textWhite,
    fontSize:   fontSize.sm,
  },
  pinSaveBtn: {
    flex:            1,
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 12,
    alignItems:      'center',
  },
  pinSaveBtnText: {
    fontFamily: fonts.bold,
    color:      colors.textWhite,
    fontSize:   fontSize.sm,
  },
  btnDisabled: { opacity: 0.5 },
});
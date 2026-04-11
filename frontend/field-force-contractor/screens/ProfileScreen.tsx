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
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../utils/api';

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
const InfoRow = (props: { icon: any; label: string; value: string }) => {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={props.icon} size={18} color={colors.textMuted} />
      <View style={infoStyles.textWrap}>
        <Text style={infoStyles.label}>{props.label}</Text>
        <Text style={infoStyles.value}>{props.value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   12,
    paddingHorizontal: spacing.md,
    gap:               spacing.md,
  },
  textWrap: { flex: 1 },
  // Small muted text above the value (e.g. "Email")
  label: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  // The actual value text (e.g. "myemail@email.com")
  value: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textWhite },
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
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
    paddingVertical:   14,
    paddingHorizontal: spacing.md,
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
  const { user, logout } = useAuth();

  // ── Offline PIN state ──────────────────────────────────────
  const [pin,            setPin]            = useState('');
  const [confirmPin,     setConfirmPin]     = useState('');
  const [pinError,       setPinError]       = useState('');
  const [pinSuccess,     setPinSuccess]     = useState('');
  const [isSavingPin,    setIsSavingPin]    = useState(false);

  const handleSavePin = async () => {
    setPinError('');
    setPinSuccess('');

    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    setIsSavingPin(true);
    try {
      await api.authPost('/auth/offline-pin', { pin });
      setPinSuccess('Offline PIN saved successfully!');
      setPin('');
      setConfirmPin('');
    } catch (err) {
      const apiErr = err as ApiError;
      setPinError(apiErr.error || 'Failed to save PIN. Please try again.');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleLogout = async () => {
    await logout();           // clears JWT from SecureStore + AuthContext
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header — avatar is shown here since the user is logged in */}
      <FieldForceHeader />
      <SubHeader title="Profile" />

      {/* ScrollView lets the content scroll if it's taller than the screen */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

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

        {/* ── Offline PIN setup section ────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline PIN</Text>
          <Text style={styles.sectionHint}>
            Set a 4+ digit PIN so you can log in when you have no internet.
          </Text>

          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(v) => { setPin(v); setPinError(''); setPinSuccess(''); }}
            placeholder="Enter PIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
          />
          <TextInput
            style={styles.pinInput}
            value={confirmPin}
            onChangeText={(v) => { setConfirmPin(v); setPinError(''); setPinSuccess(''); }}
            placeholder="Confirm PIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
          />

          {pinError !== '' && (
            <View style={styles.pinMsgRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.pinMsgText, { color: colors.error }]}>{pinError}</Text>
            </View>
          )}
          {pinSuccess !== '' && (
            <View style={styles.pinMsgRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={[styles.pinMsgText, { color: colors.success }]}>{pinSuccess}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.pinSaveBtn, isSavingPin && styles.pinSaveBtnDisabled]}
            onPress={handleSavePin}
            disabled={isSavingPin}
            activeOpacity={0.85}
          >
            {isSavingPin ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.pinSaveBtnText}>Save PIN</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Menu section ─────────────────────────────────── */}
        <View style={styles.section}>
          <MenuRow
            icon="ribbon-outline"
            label="License"
            onPress={() => navigation.navigate('LicenseDetails')}
          />
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

      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  scroll:        { flex: 1 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xl },

  // The dark blue block at the top with the avatar and name
  avatarBlock: {
    alignItems:        'center',
    backgroundColor:   '#0f1d33',
    paddingVertical:   spacing.xl,
    paddingHorizontal: spacing.md,
    gap:               spacing.xs,
    marginBottom:      spacing.sm,
  },
  avatarCircle: {
    width:           90,
    height:          90,
    borderRadius:    45,
    backgroundColor: '#1e2d45',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.sm,
  },
  name:     { fontFamily: fonts.bold,    fontSize: fontSize.xl, color: colors.textWhite },
  metaText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },

  // Each section (contact, menu) has some horizontal padding and spacing between rows
  section: { gap: spacing.sm, paddingHorizontal: spacing.md },

  // ── Offline PIN styles ──────────────────────────────────────
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize:   fontSize.base,
    color:      colors.textWhite,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    color:      colors.textMuted,
    marginBottom: 4,
  },
  pinInput: {
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
    fontFamily:        fonts.regular,
    color:             colors.textWhite,
    fontSize:          fontSize.base,
    letterSpacing:     6,
    textAlign:         'center',
  },
  pinMsgRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  pinMsgText: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.xs,
    flex:       1,
  },
  pinSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: 13,
    alignItems:      'center',
  },
  pinSaveBtnDisabled: { backgroundColor: colors.cardAlt },
  pinSaveBtnText: {
    fontFamily: fonts.bold,
    color:      colors.textWhite,
    fontSize:   fontSize.sm,
  },
});
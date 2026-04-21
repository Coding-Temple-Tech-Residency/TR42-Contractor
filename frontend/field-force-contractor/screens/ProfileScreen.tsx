// ProfileScreen.tsx  —  Troy
// Shows the logged-in contractor's profile information.
//
// Menu rows:
//   License       — contractor license details
//   Task History  — full history of completed and incomplete tasks
//   Settings      — biometric preference + appearance toggle
//   Logout        — clears session and returns to Login
//
// Settings modal persists two preferences via AsyncStorage:
//   Default biometric method  — read by BiometricScreen on next login
//   Appearance (dark/light)   — applied app-wide via ThemeContext

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons }  from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import { MainFrame } from '../components/MainFrame';

import { useTheme }           from '../contexts/ThemeContext';
import { spacing, radius, fontSize, fonts } from '../constants/theme';
import { useAuth }            from '../contexts/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export const SETTINGS_BIOMETRIC_KEY  = 'settings:defaultBiometric';
export const SETTINGS_LIGHT_MODE_KEY = 'settings:lightMode';

// ── Placeholder contractor data ───────────────────────────────
// Replace with real data from AuthContext or the backend API
const CONTRACTOR = {
  name:         'John Doe',
  contractorId: '5555555',
  vendor:       'Ex-Way',
  email:        'myemail@email.com',
  phone:        '800-555-5555',
  address:      '2000 Alee Lane, Lancaster, SC 28550',
};

// ── InfoRow ───────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, colors }: {
  icon: any; label: string; value: string; colors: any;
}) => (
  <View style={[infoStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Ionicons name={icon} size={18} color={colors.textMuted} />
    <View style={infoStyles.textWrap}>
      <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.textWhite }]}>{value}</Text>
    </View>
  </View>
);

const infoStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingVertical: 12, paddingHorizontal: spacing.md, gap: spacing.md },
  textWrap: { flex: 1 },
  label:    { fontFamily: fonts.regular, fontSize: fontSize.xs, marginBottom: 2 },
  value:    { fontFamily: fonts.regular, fontSize: fontSize.sm },
});

// ── MenuRow ───────────────────────────────────────────────────
const MenuRow = ({ icon, label, onPress, danger, colors }: {
  icon: any; label: string; onPress?: () => void; danger?: boolean; colors: any;
}) => (
  <TouchableOpacity
    style={[menuStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={menuStyles.left}>
      <Ionicons name={icon} size={18} color={danger ? colors.error : colors.textMuted} />
      <Text style={[menuStyles.label, { color: danger ? colors.error : colors.textWhite }]}>
        {label}
      </Text>
    </View>
    {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
  </TouchableOpacity>
);

const menuStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, paddingVertical: 14, paddingHorizontal: spacing.md },
  left:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { fontFamily: fonts.regular, fontSize: fontSize.base },
});

// ── ProfileScreen ─────────────────────────────────────────────
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();
  const { colors, lightMode, setLightMode } = useTheme();

  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);
  const [defaultBiometric, setDefaultBiometric] = useState<'fingerprint' | 'face'>('fingerprint');
  const [draftBiometric,   setDraftBiometric]   = useState<'fingerprint' | 'face'>('fingerprint');
  const [draftLightMode,   setDraftLightMode]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_BIOMETRIC_KEY);
        if (saved === 'face' || saved === 'fingerprint') {
          setDefaultBiometric(saved);
          setDraftBiometric(saved);
        }
      } catch {}
    };
    load();
  }, []);

  const openSettings = () => {
    setDraftBiometric(defaultBiometric);
    setDraftLightMode(lightMode);
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(SETTINGS_BIOMETRIC_KEY, draftBiometric);
      await setLightMode(draftLightMode);
      setDefaultBiometric(draftBiometric);
      setSettingsOpen(false);
      Alert.alert(
        'Settings Saved',
        `Default biometric: ${draftBiometric === 'face' ? 'Face ID' : 'Fingerprint'}.\n` +
        `Appearance: ${draftLightMode ? 'Light Mode' : 'Dark Mode'}.`,
      );
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <MainFrame header="home" headerMenu={['Menu2', ['Profile']]}>
      <StatusBar
        barStyle={lightMode ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Avatar + name ─────────────────────────────── */}
      <View style={[styles.avatarBlock, { backgroundColor: lightMode ? '#dde6f0' : '#0f1d33' }]}>
        <View style={[styles.avatarCircle, { backgroundColor: lightMode ? '#c8d8ea' : '#1e2d45' }]}>
          <Ionicons name="person" size={52} color={lightMode ? '#4a6b8a' : '#8a9bb8'} />
        </View>
        <Text style={[styles.name, { color: colors.textWhite }]}>{CONTRACTOR.name}</Text>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>Contractor ID: {CONTRACTOR.contractorId}</Text>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>Vendor: {CONTRACTOR.vendor}</Text>
      </View>

      {/* ── Contact info ──────────────────────────────── */}
      <View style={styles.section}>
        <InfoRow icon="mail-outline"     label="Email"   value={CONTRACTOR.email}   colors={colors} />
        <InfoRow icon="call-outline"     label="Phone"   value={CONTRACTOR.phone}   colors={colors} />
        <InfoRow icon="location-outline" label="Address" value={CONTRACTOR.address} colors={colors} />
      </View>

      {/* ── Menu rows ─────────────────────────────────── */}
      <View style={styles.section}>
        <MenuRow
          icon="ribbon-outline"
          label="License"
          onPress={() => navigation.navigate('LicenseDetails')}
          colors={colors}
        />
        <MenuRow
          icon="time-outline"
          label="Task History"
          onPress={() => navigation.navigate('TaskHistory')}
          colors={colors}
        />
        <MenuRow
          icon="settings-outline"
          label="Settings"
          onPress={openSettings}
          colors={colors}
        />
        <MenuRow
          icon="log-out-outline"
          label="Logout"
          onPress={handleLogout}
          danger
          colors={colors}
        />
      </View>

      {/* ── Settings Modal ────────────────────────────── */}
      <Modal
        visible={settingsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsOpen(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setSettingsOpen(false)}
        />

        <View style={[modalStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

          <View style={modalStyles.sheetHeader}>
            <Text style={[modalStyles.sheetTitle, { color: colors.textWhite }]}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsOpen(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Default biometric */}
          <Text style={[modalStyles.sectionLabel, { color: colors.textMuted }]}>DEFAULT BIOMETRIC</Text>
          <Text style={[modalStyles.sectionHint, { color: colors.textMuted }]}>
            Which method should the app prompt you with first when logging in?
          </Text>

          <View style={modalStyles.biometricRow}>
            {(['fingerprint', 'face'] as const).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  modalStyles.biometricBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  draftBiometric === method && { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
                ]}
                onPress={() => setDraftBiometric(method)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={method === 'fingerprint' ? 'finger-print' : 'scan-outline'}
                  size={28}
                  color={draftBiometric === method ? colors.primary : colors.textMuted}
                />
                <Text style={[
                  modalStyles.biometricLabel,
                  { color: draftBiometric === method ? colors.primary : colors.textMuted },
                  draftBiometric === method && { fontFamily: fonts.bold },
                ]}>
                  {method === 'fingerprint' ? 'Fingerprint' : 'Face ID'}
                </Text>
                {draftBiometric === method && (
                  <View style={[modalStyles.checkBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Appearance */}
          <Text style={[modalStyles.sectionLabel, { color: colors.textMuted, marginTop: spacing.xl }]}>APPEARANCE</Text>
          <Text style={[modalStyles.sectionHint, { color: colors.textMuted }]}>
            Switch between dark and light mode.
          </Text>

          <View style={[modalStyles.appearanceRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={modalStyles.appearanceLeft}>
              <Ionicons
                name={draftLightMode ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={colors.primary}
              />
              <View>
                <Text style={[modalStyles.appearanceTitle, { color: colors.textWhite }]}>
                  {draftLightMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
                <Text style={[modalStyles.appearanceHint, { color: colors.textMuted }]}>
                  {draftLightMode ? 'Light theme active' : 'Dark theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={draftLightMode}
              onValueChange={setDraftLightMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              modalStyles.saveBtn,
              { backgroundColor: isSaving ? colors.cardAlt : colors.primary },
            ]}
            onPress={handleSaveSettings}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={modalStyles.saveBtnText}>
              {isSaving ? 'Saving…' : 'Save Settings'}
            </Text>
          </TouchableOpacity>

          <View style={[modalStyles.noteBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[modalStyles.noteText, { color: colors.textMuted }]}>
              Biometric preference takes effect on next login. Light mode applies to the whole app immediately.
            </Text>
          </View>

        </View>
      </Modal>

    </MainFrame>
  );
}

const styles = StyleSheet.create({

  avatarBlock:  { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md, gap: spacing.xs, width: '100%', marginBottom: spacing.sm },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  name:         { fontFamily: fonts.bold,    fontSize: fontSize.xl },
  metaText:     { fontFamily: fonts.regular, fontSize: fontSize.sm },
  section:      { gap: spacing.sm, paddingHorizontal: spacing.md, width: '100%', marginBottom: spacing.sm },
});

const modalStyles = StyleSheet.create({
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:           { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  handle:          { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  sheetTitle:      { fontFamily: fonts.bold, fontSize: fontSize.lg },
  sectionLabel:    { fontFamily: fonts.bold, fontSize: fontSize.xs, letterSpacing: 1.2, marginBottom: spacing.xs },
  sectionHint:     { fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.md },
  biometricRow:    { flexDirection: 'row', gap: spacing.md },
  biometricBtn:    { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md, borderWidth: 2, position: 'relative' },
  biometricLabel:  { fontFamily: fonts.regular, fontSize: fontSize.sm },
  checkBadge:      { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appearanceRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  appearanceLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  appearanceTitle: { fontFamily: fonts.bold,    fontSize: fontSize.base },
  appearanceHint:  { fontFamily: fonts.regular, fontSize: fontSize.xs, marginTop: 2 },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: 15, marginBottom: spacing.md, marginTop: spacing.sm },
  saveBtnText:     { fontFamily: fonts.bold, color: '#fff', fontSize: fontSize.base, letterSpacing: 0.5 },
  noteBox:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noteText:        { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.xs, lineHeight: 18 },
});
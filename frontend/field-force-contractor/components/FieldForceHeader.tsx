/**
 * components/FieldForceHeader.tsx — Shared header components (Troy)
 *
 * TWO exports:
 *
 *  <FieldForceHeader />
 *    Brand bar at the top of every screen.
 *    Shield icon + italic "Field Force" on the left.
 *    Avatar on the right — tapping navigates to Profile (Troy).
 *    Pass showAvatar={false} on auth screens (Login, Biometric, etc.)
 *
 *  <SubHeader title="…" />
 *    Navy sub-bar with back arrow + centred title.
 *    Used on inner screens: Profile, License, Reset Password, etc.
 *    Defaults to navigation.goBack(); pass onBack to override.
 *
 * ── TEAMMATE NOTES ───────────────────────────────────────────
 * Charlie / Jonathan:
 *   Add <FieldForceHeader /> at the top of each of your screens.
 *   On detail screens also add <SubHeader title="…" /> below it.
 *   The avatar already wires to Troy's Profile — nothing extra needed.
 * ─────────────────────────────────────────────────────────────
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fonts } from '../constants/theme';

// ── FieldForceHeader ─────────────────────────────────────────

type FieldForceHeaderProps = {
  showAvatar?: boolean;  // default true
};

export function FieldForceHeader({ showAvatar = true }: FieldForceHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={20} color={colors.textWhite} />
        </View>
        <Text style={styles.brandText}>Field Force</Text>
      </View>

      {showAvatar && (
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle" size={34} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── SubHeader ────────────────────────────────────────────────

type SubHeaderProps = {
  title:   string;
  onBack?: () => void;
};

export function SubHeader({ title, onBack }: SubHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.subHeader}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack ?? (() => navigation.goBack())}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={colors.textWhite} />
      </TouchableOpacity>

      <Text style={styles.subTitle}>{title}</Text>

      {/* Spacer keeps title centred */}
      <View style={styles.backBtn} />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  shieldWrap: {
    width:           32,
    height:          32,
    borderRadius:    8,
    backgroundColor: '#1a3a6b',
    alignItems:      'center',
    justifyContent:  'center',
  },
  brandText: {
    fontFamily:    fonts.boldItalic,
    color:         colors.textWhite,
    fontSize:      fontSize.lg,
    letterSpacing: 0.5,
  },
  avatarBtn: { padding: 2 },

  subHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   '#142040',
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
  },
  backBtn: {
    width:      36,
    alignItems: 'center',
  },
  subTitle: {
    flex:          1,
    fontFamily:    fonts.bold,
    color:         colors.textWhite,
    fontSize:      fontSize.lg,
    textAlign:     'center',
    letterSpacing: 0.3,
  },
});
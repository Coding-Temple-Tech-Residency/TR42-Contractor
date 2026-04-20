// LicenseScreen.tsx  —  Troy
// Shows the contractor's license card with expandable detail rows.
// Reached by tapping "License" on the Profile screen.
//
// Uses MainFrame header="home" with Menu2 providing the back arrow
// and "License Details" title. No SubHeader needed.
//
// ── LICENSE STATUS LOGIC ──────────────────────────────────────────────────────
// Status is derived from the expiration date at runtime — never hardcoded:
//   Expired        — past the expiration date                 (red)
//   Expiring Soon  — within the next 30 days                  (amber)
//   Active         — more than 30 days away                   (green)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons }      from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { MainFrame } from '../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

// ── Placeholder license data ──────────────────────────────────────────────────
const MOCK_LICENSE = {
  name:       'John Doe',
  type:       'CITIZEN',
  licenseNo:  '25415236563',
  expiration: '01/20/2025',
  role:       'Contractor',
  conditions: 'None',
  taxClass:   '1099',
  photoUri:   'https://randomuser.me/api/portraits/men/32.jpg',
};

const DEMO_ACTIVE_DATE = '12/31/2027';

// ── License status helpers ────────────────────────────────────────────────────
const EXPIRING_SOON_DAYS = 30;
type LicenseStatus = 'Active' | 'Expiring Soon' | 'Expired';

function getLicenseStatus(expirationMMDDYYYY: string): LicenseStatus {
  const [month, day, year] = expirationMMDDYYYY.split('/').map(Number);
  const expDate = new Date(year, month - 1, day);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0)                   return 'Expired';
  if (daysUntil <= EXPIRING_SOON_DAYS) return 'Expiring Soon';
  return 'Active';
}

function getDaysUntilExpiration(expirationMMDDYYYY: string): number {
  const [month, day, year] = expirationMMDDYYYY.split('/').map(Number);
  const expDate = new Date(year, month - 1, day);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(status: LicenseStatus): string {
  if (status === 'Expired')       return colors.error;
  if (status === 'Expiring Soon') return colors.warning;
  return colors.success;
}

// ── DetailRow ─────────────────────────────────────────────────────────────────
type DetailRowProps = { label: string; value: string; isOpen: boolean; onToggle: () => void; };

const DetailRow = (props: DetailRowProps) => (
  <TouchableOpacity style={rowStyles.container} onPress={props.onToggle} activeOpacity={0.8}>
    <View style={rowStyles.header}>
      <View style={rowStyles.dot} />
      <Text style={rowStyles.label}>{props.label}</Text>
      <Ionicons name={props.isOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.textMuted} />
    </View>
    {props.isOpen && <Text style={rowStyles.value}>{props.value}</Text>}
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: spacing.md, gap: spacing.xs },
  header:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  label:     { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.base, color: colors.textWhite },
  value:     { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, paddingLeft: 20, marginTop: spacing.xs },
});

// ── LicenseScreen ─────────────────────────────────────────────────────────────
export default function LicenseScreen() {
  const navigation = useNavigation<any>();

  const [openRow,       setOpenRow]       = useState<string | null>(null);
  const [showingActive, setShowingActive] = useState(false);

  const currentExpiration = showingActive ? DEMO_ACTIVE_DATE : MOCK_LICENSE.expiration;
  const licenseStatus     = getLicenseStatus(currentExpiration);
  const daysUntilExp      = getDaysUntilExpiration(currentExpiration);
  const statusColor       = getStatusColor(licenseStatus);
  const showWarning       = licenseStatus === 'Expired' || licenseStatus === 'Expiring Soon';

  const toggleRow = (key: string) => setOpenRow(prev => (prev === key ? null : key));

  return (
    <MainFrame header="home" headerMenu={['Menu2', ['License Details']]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Warning banner — only shown when expired or expiring soon */}
      {showWarning && (
        <View style={[
          styles.warningBanner,
          {
            borderColor:     statusColor,
            backgroundColor: licenseStatus === 'Expired'
              ? 'rgba(248,113,113,0.10)'
              : 'rgba(245,158,11,0.10)',
          },
        ]}>
          <Ionicons
            name={licenseStatus === 'Expired' ? 'close-circle-outline' : 'warning-outline'}
            size={18}
            color={statusColor}
          />
          <Text style={[styles.warningText, { color: statusColor }]}>
            {licenseStatus === 'Expired'
              ? `Your license expired ${Math.abs(daysUntilExp)} day${Math.abs(daysUntilExp) === 1 ? '' : 's'} ago. Contact your vendor to renew.`
              : `Your license expires in ${daysUntilExp} day${daysUntilExp === 1 ? '' : 's'}. Renew soon to avoid disruption.`
            }
          </Text>
        </View>
      )}

      {/* License card */}
      <View style={styles.licenseCard}>
        <Image source={{ uri: MOCK_LICENSE.photoUri }} style={styles.photo} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{MOCK_LICENSE.name}</Text>
          <Text style={styles.cardType}>{MOCK_LICENSE.type}</Text>
          <Text style={styles.licenseLabel}>License No.</Text>
          <Text style={styles.licenseNumber}>{MOCK_LICENSE.licenseNo}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status </Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>{licenseStatus}</Text>
          </View>
        </View>
      </View>

      {/* Expandable detail rows */}
      <View style={styles.detailsList}>
        <DetailRow label="Expiration" value={currentExpiration} isOpen={openRow === 'expiration'} onToggle={() => toggleRow('expiration')} />
        <DetailRow label="Role"       value={MOCK_LICENSE.role}       isOpen={openRow === 'role'}       onToggle={() => toggleRow('role')} />
        <DetailRow label="Conditions" value={MOCK_LICENSE.conditions} isOpen={openRow === 'conditions'} onToggle={() => toggleRow('conditions')} />
        <DetailRow label="Tax Class"  value={MOCK_LICENSE.taxClass}   isOpen={openRow === 'taxClass'}   onToggle={() => toggleRow('taxClass')} />
      </View>

      {/* Dev toggle button */}
      <TouchableOpacity
        style={styles.devToggleBtn}
        onPress={() => setShowingActive(prev => !prev)}
        activeOpacity={0.8}
      >
        <Ionicons name="construct-outline" size={14} color={colors.warning} />
        <Text style={styles.devToggleText}>
          Toggle Status (Dev) — showing:{' '}
          <Text style={{ fontFamily: fonts.bold }}>{showingActive ? 'Active' : 'Expired'}</Text>
        </Text>
      </TouchableOpacity>

    </MainFrame>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.md, padding: spacing.md,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  warningText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20 },

  licenseCard: {
    flexDirection: 'row', backgroundColor: '#0f1d33',
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  photo:         { width: 70, height: 70, borderRadius: 8, backgroundColor: colors.cardAlt },
  cardInfo:      { flex: 1, gap: 2 },
  cardName:      { fontFamily: fonts.bold,    fontSize: fontSize.lg, color: colors.textWhite },
  cardType:      { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight, marginBottom: 6 },
  licenseLabel:  { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.primary },
  licenseNumber: { fontFamily: fonts.bold,    fontSize: fontSize.sm, color: colors.textWhite, marginBottom: 4 },
  statusRow:     { flexDirection: 'row', alignItems: 'center' },
  statusLabel:   { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  statusValue:   { fontFamily: fonts.bold,    fontSize: fontSize.sm },

  detailsList: {
    gap: spacing.sm, paddingHorizontal: spacing.md,
    width: '100%', maxWidth: 480, alignSelf: 'center', marginTop: spacing.md,
  },

  devToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', marginTop: spacing.xl, marginBottom: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.warning, backgroundColor: 'rgba(245,158,11,0.08)',
  },
  devToggleText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.warning },
});
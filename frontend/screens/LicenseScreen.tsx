// LicenseScreen.tsx
// Shows the contractor's license card with expandable detail rows.
// Reached by tapping "License" on the Profile screen.
//
// The detail rows (Expiration, Role, Conditions, Tax Class) expand
// and collapse when tapped, showing one at a time.

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MainFrame } from '../components/MainFrame';
import { useSetNavigationUI, UI } from '../contexts/NavigationUIContext';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { Assets } from '../constants/Assets';

// ---------------------------------------------------------------
// Placeholder license data — replace with real data from your API
// or pass it in via navigation params from the Profile screen
// ---------------------------------------------------------------
const MOCK_LICENSE = {
  name:       'John Doe',
  type:       'CITIZEN',
  licenseNo:  '25415236563',
  status:     'Active',
  expiration: '01/20/2025',
  role:       'Contractor',
  conditions: 'None',
  taxClass:   '1099',
};

// ---------------------------------------------------------------
// DetailRow — one expandable row for a single license detail.
// It shows just the label and a chevron arrow when closed.
// When opened (isOpen = true), it also shows the value below.
// ---------------------------------------------------------------
// Defines the shape of the props (inputs) this component expects.
// Pulling the type out here keeps the function signature clean and readable.
type DetailRowProps = {
  label:    string;
  value:    string;
  isOpen:   boolean;
  onToggle: () => void;
};

const DetailRow = (props: DetailRowProps) => {
  return (
    <TouchableOpacity style={rowStyles.container} onPress={props.onToggle} activeOpacity={0.8}>

      {/* The always-visible header row with dot, label, and arrow */}
      <View style={rowStyles.header}>
        <View style={rowStyles.dot} />
        <Text style={rowStyles.label}>{props.label}</Text>
        {/* Arrow points forward when closed, up when open */}
        <Ionicons
          name={props.isOpen ? 'chevron-up' : 'chevron-forward'}
          size={18}
          color={colors.textMuted}
        />
      </View>

      {/* The value only renders when this row is open */}
      {props.isOpen && (
        <Text style={rowStyles.value}>{props.value}</Text>
      )}

    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    backgroundColor:   colors.card,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   14,
    paddingHorizontal: spacing.md,
    gap:               spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4, // makes the square into a circle
    backgroundColor: colors.textMuted,
  },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.base, color: colors.textWhite },
  value: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.sm,
    color:      colors.textMuted,
    paddingLeft: 20, // indents the value to align under the label
    marginTop:  spacing.xs,
  },
});

// ---------------------------------------------------------------
// Main LicenseScreen component
// ---------------------------------------------------------------
export default function LicenseScreen() {
  useSetNavigationUI(UI.back('License Details'));
  const [openRow, setOpenRow] = useState<string | null>(null);

  // If the tapped row is already open, close it. Otherwise open it.
  // This ensures only one row is open at a time.
  const toggleRow = (key: string) => {
    if (openRow === key) {
      setOpenRow(null); // close it
    } else {
      setOpenRow(key);  // open this one
    }
  }

  return (
    <MainFrame header="home" headerMenu={["Menu2", ["License Details"]]}>

        {/* ── License card ─────────────────────────────────── */}
        <View style={styles.licenseCard}>

          {/* Contractor photo on the left */}
          <Image
            source={Assets.icons.ProfileIcon}
            style={styles.photo}
            contentFit="contain"
            transition={120}
            cachePolicy="memory-disk"
          />

          {/* License info on the right */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{MOCK_LICENSE.name}</Text>
            <Text style={styles.cardType}>{MOCK_LICENSE.type}</Text>

            {/* License number — orange label above, white number below */}
            <Text style={styles.licenseLabel}>License No.</Text>
            <Text style={styles.licenseNumber}>{MOCK_LICENSE.licenseNo}</Text>

            {/* Status shown in green to indicate active */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status </Text>
              <Text style={styles.statusValue}>{MOCK_LICENSE.status}</Text>
            </View>
          </View>
        </View>

        {/* ── Expandable detail rows ────────────────────────── */}
        <View style={styles.detailsList}>
          <DetailRow
            label="Expiration"
            value={MOCK_LICENSE.expiration}
            isOpen={openRow === 'expiration'}
            onToggle={() => toggleRow('expiration')}
          />
          <DetailRow
            label="Role"
            value={MOCK_LICENSE.role}
            isOpen={openRow === 'role'}
            onToggle={() => toggleRow('role')}
          />
          <DetailRow
            label="Conditions"
            value={MOCK_LICENSE.conditions}
            isOpen={openRow === 'conditions'}
            onToggle={() => toggleRow('conditions')}
          />
          <DetailRow
            label="Tax Class"
            value={MOCK_LICENSE.taxClass}
            isOpen={openRow === 'taxClass'}
            onToggle={() => toggleRow('taxClass')}
          />
        </View>

    </MainFrame>
  );
}

const styles = StyleSheet.create({
  // The card at the top with photo + license info
  licenseCard: {
    flexDirection:    'row',
    backgroundColor:  '#0f1d33',
    width:            '90%',
    borderRadius:     radius.lg,
    padding:          spacing.md,
    gap:              spacing.md,
    borderWidth:      1,
    borderColor:      colors.border,
    marginBottom:     spacing.sm,
  },
  photo: {
    width:           70,
    height:          70,
    borderRadius:    8,
    backgroundColor: colors.cardAlt, // shown as a gray box if the image fails to load
  },
  cardInfo:     { flex: 1, gap: 2 },
  cardName:     { fontFamily: fonts.bold,    fontSize: fontSize.lg, color: colors.textWhite },
  cardType:     { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight, marginBottom: 6 },
  licenseLabel: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.primary },
  licenseNumber: { fontFamily: fonts.bold,   fontSize: fontSize.sm, color: colors.textWhite, marginBottom: 4 },
  statusRow:    { flexDirection: 'row', alignItems: 'center' },
  statusLabel:  { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight },
  statusValue:  { fontFamily: fonts.bold,    fontSize: fontSize.sm, color: colors.success }, // green

  // The list of expandable rows below the card
  detailsList: { gap: spacing.sm, width: '90%' },
});

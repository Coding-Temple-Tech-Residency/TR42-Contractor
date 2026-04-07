// ProfileScreen.tsx
// Shows the logged-in contractor's profile information.
// Reached by tapping the avatar icon in the top-right of any screen.
//
// Sections:
//   1. Avatar + name + contractor ID + vendor
//   2. Contact info (email, phone, address)
//   3. Menu rows (License, Settings, Logout)

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

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

  const handleLogout = () => {
    // TODO: Clear auth tokens and any stored user data before navigating away.
    // For example: await SecureStore.deleteItemAsync('authToken');
    navigation.replace('Login');
  }

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
});
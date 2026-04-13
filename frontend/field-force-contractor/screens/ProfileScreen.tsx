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
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FieldForceHeader, SubHeader } from '../components/FieldForceHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { Assets } from '../constants/Assets';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

// ---------------------------------------------------------------
// Placeholder contractor data — replace with real data from auth
// context or API once the backend is ready
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
// InfoRow — reusable contact-detail row
// ---------------------------------------------------------------
const InfoRow = (props: { icon: any; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Ionicons name={props.icon} size={18} color={colors.textMuted} />
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
    backgroundColor:   'rgba(26, 43, 66, 0.85)', // cards use a translucent navy so the bg image shows through
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   12,
    paddingHorizontal: spacing.md,
    gap:               spacing.md,
  },
  textWrap: { flex: 1 },
  label:    { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  value:    { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textWhite },
});

// ---------------------------------------------------------------
// MenuRow — tappable row with icon, label, and optional chevron
// ---------------------------------------------------------------
type MenuRowProps = {
  icon:     any;
  label:    string;
  onPress?: () => void;
  danger?:  boolean;
};

const MenuRow = (props: MenuRowProps) => (
  <TouchableOpacity style={menuStyles.row} onPress={props.onPress} activeOpacity={0.75}>
    <View style={menuStyles.left}>
      <Ionicons
        name={props.icon}
        size={18}
        color={props.danger ? colors.error : colors.textMuted}
      />
      <Text style={[menuStyles.label, props.danger && menuStyles.labelDanger]}>
        {props.label}
      </Text>
    </View>
    {props.danger !== true && (
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

const menuStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   'rgba(26, 43, 66, 0.85)',
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingVertical:   14,
    paddingHorizontal: spacing.md,
  },
  left:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label:       { fontFamily: fonts.regular, fontSize: fontSize.base, color: colors.textWhite },
  labelDanger: { color: colors.error },
});

// ---------------------------------------------------------------
// Main ProfileScreen component
// ---------------------------------------------------------------
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    // ImageBackground wraps the entire screen so SplashScreenBackGround.png
    // shows behind the header, content, and bottom nav — matching all other screens.
    <ImageBackground
      source={Assets.backgrounds.MainFrame.MainbackgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* SafeAreaView is transparent so the background image shows through */}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <FieldForceHeader />
        <SubHeader title="Profile" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar + name ───────────────────────────────────── */}
          <View style={styles.avatarBlock}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={52} color="#8a9bb8" />
            </View>
            <Text style={styles.name}>{CONTRACTOR.name}</Text>
            <Text style={styles.metaText}>Contractor ID: {CONTRACTOR.contractorId}</Text>
            <Text style={styles.metaText}>Vendor: {CONTRACTOR.vendor}</Text>
          </View>

          {/* ── Contact info ─────────────────────────────────────── */}
          <View style={styles.section}>
            <InfoRow icon="camera-outline"   label="Email"   value={CONTRACTOR.email}   />
            <InfoRow icon="call-outline"     label="Phone"   value={CONTRACTOR.phone}   />
            <InfoRow icon="location-outline" label="Address" value={CONTRACTOR.address} />
          </View>

          {/* ── Menu rows ────────────────────────────────────────── */}
          <View style={styles.section}>
            <MenuRow
              icon="ribbon-outline"
              label="License"
              onPress={() => navigation.navigate('LicenseDetails')}
            />
            <MenuRow
              icon="settings-outline"
              label="Settings"
              onPress={() => { /* TODO: navigate to Settings */ }}
            />
            <MenuRow
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              danger
            />
          </View>

        </ScrollView>

        <BottomNavigation />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  // Transparent so the ImageBackground shows through the SafeAreaView
  container:       { flex: 1, backgroundColor: 'transparent' },
  scroll:          { flex: 1 },
  scrollContent:   { gap: spacing.md, paddingBottom: spacing.xl },

  avatarBlock: {
    alignItems:        'center',
    backgroundColor:   'rgba(15, 29, 51, 0.75)', // semi-transparent so bg image shows
    paddingVertical:   spacing.xl,
    paddingHorizontal: spacing.md,
    gap:               spacing.xs,
    marginBottom:      spacing.sm,
  },
  avatarCircle: {
    width:           90,
    height:          90,
    borderRadius:    45,
    backgroundColor: 'rgba(30, 45, 69, 0.9)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.sm,
  },
  name:     { fontFamily: fonts.bold,    fontSize: fontSize.xl, color: colors.textWhite },
  metaText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },

  section: { gap: spacing.sm, paddingHorizontal: spacing.md },
});
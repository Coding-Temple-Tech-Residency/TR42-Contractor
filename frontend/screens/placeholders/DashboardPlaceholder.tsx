/**
 * screens/placeholders/DashboardPlaceholder.tsx
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ⚠️  CHARLIE — THIS FILE IS YOURS TO REPLACE  ⚠️         ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * This placeholder sits where your real Dashboard will live.
 * It is the screen users land on after a successful login.
 *
 * YOUR APPROVED DESIGN (Image 9 — Dashboard) SHOWS:
 *   • FieldForceHeader at the top
 *   • SubHeader with title "Home" and a back arrow
 *   • Status bar: Completed / Pending / Progress stats
 *   • Drive Status — Active banner
 *   • Recent Activity list (green / red / yellow dots)
 *   • MainFrame footer at the bottom
 *
 * HOW TO PLUG IN YOUR REAL SCREEN:
 *   1. Build your Dashboard component in:
 *        screens/DashboardScreen.tsx
 *      Export it as a default export:
 *        export default function DashboardScreen() { ... }
 *
 *   2. Open App.tsx and make these two changes:
 *        REMOVE: import DashboardPlaceholder from "./screens/placeholders/DashboardPlaceholder";
 *        ADD:    import DashboardScreen from "./screens/DashboardScreen";
 *
 *   3. In App.tsx, find this line:
 *        <StackNavigator.Screen name="Dashboard" component={DashboardPlaceholder} />
 *      Change it to:
 *        <StackNavigator.Screen name="Dashboard" component={DashboardScreen} />
 *
 * INTEGRATION POINTS:
 *   • Troy navigates here via:   navigation.replace('Dashboard')
 *   • MainFrame footer "Home" item also navigates here
 *   • Avatar icon in your header should call:  navigation.navigate('Profile')
 *     (this is already wired inside FieldForceHeader — just use it)
 *   • "Work Orders" tab navigates to:  'WorkOrders'  (Jonathan's screen)
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../../constants/theme';
import { useSetNavigationUI, UI } from '../../contexts/NavigationUIContext';

const stats = [
  { icon: 'checkmark-circle' as const, label: 'Completed', value: '24',  color: '#60a5fa' },
  { icon: 'time'             as const, label: 'Pending',   value: '8',   color: '#f59e0b' },
  { icon: 'trending-up'      as const, label: 'Progress',  value: '75%', color: '#a78bfa' },
];

const activities = [
  { label: 'Update project documentation', time: '2 hours ago', color: colors.success },
  { label: 'Review team feedback',          time: '4 hours ago', color: colors.success },
  { label: 'Schedule meeting with clients', time: '1 day ago',   color: '#f59e0b'      },
];

export default function DashboardPlaceholder() {
  useSetNavigationUI(UI.main);
  return (
    <MainFrame>
      <View style={styles.container}>

        <Text style={styles.welcome}>Welcome back!</Text>

        {/* Status pill */}
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Status: Work</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={22} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {activities.map((a, i) => (
            <View key={i} style={[styles.activityRow, i > 0 && styles.activityBorder]}>
              <View style={[styles.activityDot, { backgroundColor: a.color }]} />
              <View>
                <Text style={styles.activityLabel}>{a.label}</Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Drive alert */}
        <TouchableOpacity style={styles.driveAlert} activeOpacity={0.8}>
          <Text style={styles.driveAlertText}>Over 11 hours drive time, time for a break</Text>
        </TouchableOpacity>

        <Text style={styles.notice}>⚠️ Charlie — replace with your real Dashboard screen</Text>
      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  container:      { width: '90%', gap: spacing.md, paddingVertical: spacing.md },
  welcome:        { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  statusRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  statusDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  statusText:     { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite },
  statsRow:       { flexDirection: 'row', gap: spacing.sm },
  statCard:       { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', gap: 4 },
  statValue:      { fontFamily: fonts.bold, fontSize: fontSize.xl },
  statLabel:      { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  card:           { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  cardTitle:      { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.textWhite, marginBottom: spacing.xs },
  activityRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs },
  activityBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  activityDot:    { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  activityLabel:  { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite },
  activityTime:   { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  driveAlert:     { backgroundColor: '#ef4444', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  driveAlertText: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.textWhite, textAlign: 'center' },
  notice:         { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

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

import { View, Text, StyleSheet } from 'react-native';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, fontSize, fonts } from '../../constants/theme';
import { useSetNavigationUI, UI } from '../../contexts/NavigationUIContext';

export default function DashboardPlaceholder() {
  useSetNavigationUI(UI.main);
  return (
    <MainFrame header="home">
      <View style={styles.body}>
        <Text style={styles.heading}>⚠️  Dashboard Placeholder</Text>
        <Text style={styles.sub}>
          Charlie — replace this file with your real Dashboard screen.{'\n'}
          See the comments at the top of this file for full instructions.
        </Text>
      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.lg,
    gap:            spacing.md,
    minHeight:      400,
  },
  heading: { fontFamily: fonts.bold,    fontSize: fontSize.lg, color: colors.primary,   textAlign: 'center' },
  sub:     { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

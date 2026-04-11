/**
 * screens/placeholders/WorkOrdersPlaceholder.tsx
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ⚠️  JONATHAN — THIS FILE IS YOURS TO REPLACE  ⚠️        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * This placeholder sits where your real Work Orders screen will live.
 * It is reached via the "Work Orders" item in the MainFrame footer.
 *
 * HOW TO PLUG IN YOUR REAL SCREEN:
 *   1. Build your screen in:
 *        screens/WorkOrdersScreen.tsx
 *      Export it as a default export:
 *        export default function WorkOrdersScreen() { ... }
 *
 *   2. Open App.tsx and make these two changes:
 *        REMOVE: import WorkOrdersPlaceholder from "./screens/placeholders/WorkOrdersPlaceholder";
 *        ADD:    import WorkOrdersScreen from "./screens/WorkOrdersScreen";
 *
 *   3. In App.tsx, find:
 *        <StackNavigator.Screen name="WorkOrders" component={WorkOrdersPlaceholder} />
 *      Change to:
 *        <StackNavigator.Screen name="WorkOrders" component={WorkOrdersScreen} />
 *
 * INTEGRATION POINTS:
 *   • MainFrame footer "Work Orders" item navigates here
 *   • When a user taps a job, navigate to JobDetail with params:
 *       navigation.navigate('JobDetail', { jobId: '...', workOrderId: '...' })
 *   • Avatar icon in your header navigates to 'Profile' (Troy's screen)
 *     — just use <FieldForceHeader /> and it's wired automatically
 */

import { View, Text, StyleSheet } from 'react-native';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, fontSize, fonts } from '../../constants/theme';
import { useSetNavigationUI, UI } from '../../contexts/NavigationUIContext';

export default function WorkOrdersPlaceholder() {
  useSetNavigationUI(UI.main);
  return (
    <MainFrame header="home">
      <View style={styles.body}>
        <Text style={styles.heading}>⚠️  Work Orders Placeholder</Text>
        <Text style={styles.sub}>
          Jonathan — replace this file with your real Work Orders screen.{'\n'}
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

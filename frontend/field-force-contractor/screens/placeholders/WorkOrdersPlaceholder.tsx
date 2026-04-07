/**
 * screens/placeholders/WorkOrdersPlaceholder.tsx
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ⚠️  JONATHAN — THIS FILE IS YOURS TO REPLACE  ⚠️        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * This placeholder sits where your real Work Orders screen will live.
 * It is reached via the "Work Orders" tab in BottomNavigation.
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
 *   • BottomNavigation "Work Orders" tab navigates here
 *   • When a user taps a job, navigate to JobDetail with params:
 *       navigation.navigate('JobDetail', { jobId: '...', workOrderId: '...' })
 *   • Avatar icon in your header navigates to 'Profile' (Troy's screen)
 *     — just use <FieldForceHeader /> and it's wired automatically
 */

import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { FieldForceHeader, SubHeader } from '../../components/FieldForceHeader';
import { BottomNavigation } from '../../components/BottomNavigation';
import { colors, spacing, fontSize, fonts } from '../../constants/theme';

export default function WorkOrdersPlaceholder() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <FieldForceHeader />
      <SubHeader title="Work Orders" />

      <View style={styles.body}>
        <Text style={styles.heading}>⚠️  Work Orders Placeholder</Text>
        <Text style={styles.sub}>
          Jonathan — replace this file with your real Work Orders screen.{'\n'}
          See the comments at the top of this file for full instructions.
        </Text>
      </View>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.lg,
    gap:            spacing.md,
  },
  heading: { fontFamily: fonts.bold,    fontSize: fontSize.lg, color: colors.primary,   textAlign: 'center' },
  sub:     { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
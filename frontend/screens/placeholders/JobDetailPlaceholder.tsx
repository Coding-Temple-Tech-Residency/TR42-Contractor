/**
 * screens/placeholders/JobDetailPlaceholder.tsx
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ⚠️  JONATHAN — THIS FILE IS YOURS TO REPLACE  ⚠️        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * This placeholder sits where your real Job Detail screen will live.
 * It receives navigation params: { jobId: string, workOrderId: string }
 *
 * HOW TO PLUG IN YOUR REAL SCREEN:
 *   1. Build your screen in:
 *        screens/JobDetailScreen.tsx
 *      Export it as a default export:
 *        export default function JobDetailScreen() { ... }
 *      Read params with:
 *        const { jobId, workOrderId } = useRoute<any>().params;
 *
 *   2. Open App.tsx and make these two changes:
 *        REMOVE: import JobDetailPlaceholder from "./screens/placeholders/JobDetailPlaceholder";
 *        ADD:    import JobDetailScreen from "./screens/JobDetailScreen";
 *
 *   3. In App.tsx, find:
 *        <StackNavigator.Screen name="JobDetail" component={JobDetailPlaceholder} />
 *      Change to:
 *        <StackNavigator.Screen name="JobDetail" component={JobDetailScreen} />
 *
 * INTEGRATION POINTS:
 *   • Navigate here from WorkOrders with:
 *       navigation.navigate('JobDetail', { jobId: '...', workOrderId: '...' })
 *   • The MainFrame footer stays visible while this screen is open
 *   • Avatar icon → Profile (Troy) is wired through the shared MainFrame header
 */

import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, fontSize, fonts } from '../../constants/theme';

export default function JobDetailPlaceholder() {
  const route = useRoute<any>();
  const { jobId, workOrderId } = route.params ?? {};

  return (
    <MainFrame header="home" headerMenu={["Menu2", ["Job Detail"]]}>
      <View style={styles.body}>
        <Text style={styles.heading}>⚠️  Job Detail Placeholder</Text>
        <Text style={styles.sub}>
          Jonathan — replace this file with your real Job Detail screen.{'\n'}
          See the comments at the top of this file for full instructions.
        </Text>
        {/* Shows the params so you can verify navigation works */}
        {jobId && (
          <Text style={styles.params}>
            jobId: {jobId}{'\n'}workOrderId: {workOrderId}
          </Text>
        )}
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
  },
  heading: { fontFamily: fonts.bold,    fontSize: fontSize.lg, color: colors.primary,   textAlign: 'center' },
  sub:     { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  params: {
    fontFamily:      fonts.regular,
    fontSize:        fontSize.xs,
    color:           colors.textDisabled,
    textAlign:       'center',
    backgroundColor: colors.card,
    padding:         spacing.sm,
    borderRadius:    6,
    marginTop:       spacing.sm,
  },
});

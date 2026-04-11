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

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../../constants/theme';
import { useSetNavigationUI, UI } from '../../contexts/NavigationUIContext';

export default function JobDetailPlaceholder() {
  useSetNavigationUI(UI.back('Job Detail'));
  const route = useRoute<any>();
  const { jobId, workOrderId } = route.params ?? { jobId: 'WO-001', workOrderId: 'WO-001' };

  return (
    <MainFrame>
      <View style={styles.container}>

        {/* Job info card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>{workOrderId}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>In Progress</Text>
            </View>
          </View>
          <Text style={styles.jobTitle}>HVAC Maintenance</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>123 Main St, Charlotte, NC 28201</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>Scheduled: Apr 12, 2026 — 9:00 AM</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>Client: John Smith</Text>
          </View>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={colors.textMuted} />
          <Text style={styles.mapText}>Map view goes here</Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={18} color={colors.textWhite} />
          <Text style={styles.primaryBtnText}>Get Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Mark Complete</Text>
        </TouchableOpacity>

        {/* Params debug */}
        <View style={styles.paramsBox}>
          <Text style={styles.paramsText}>jobId: {jobId}  |  workOrderId: {workOrderId}</Text>
        </View>

        <Text style={styles.notice}>⚠️ Jonathan — replace with your real Job Detail screen</Text>
      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  container:      { width: '90%', gap: spacing.md, paddingVertical: spacing.md },
  card:           { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId:        { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  statusBadge:    { backgroundColor: 'rgba(96,165,250,0.15)', borderRadius: 20, borderWidth: 1, borderColor: '#60a5fa', paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText:     { fontFamily: fonts.bold, fontSize: fontSize.xs, color: '#60a5fa' },
  jobTitle:       { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.textWhite },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText:       { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textLight, flex: 1 },
  mapPlaceholder: { height: 180, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapText:        { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14 },
  primaryBtnText: { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.textWhite },
  secondaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, paddingVertical: 14 },
  secondaryBtnText:{ fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.primary },
  paramsBox:      { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  paramsText:     { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textDisabled },
  notice:         { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});

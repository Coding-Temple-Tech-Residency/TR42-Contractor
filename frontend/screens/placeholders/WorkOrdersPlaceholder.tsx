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

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { MainFrame } from '../../components/MainFrame';
import { colors, spacing, radius, fontSize, fonts } from '../../constants/theme';
import { useSetNavigationUI, UI } from '../../contexts/NavigationUIContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const mockOrders = [
  { id: 'WO-001', title: 'HVAC Maintenance',      address: '123 Main St, Charlotte, NC',   status: 'In Progress', statusColor: '#60a5fa' },
  { id: 'WO-002', title: 'Electrical Inspection',  address: '456 Oak Ave, Lancaster, SC',   status: 'Pending',     statusColor: '#f59e0b' },
  { id: 'WO-003', title: 'Plumbing Repair',        address: '789 Pine Rd, Rock Hill, SC',   status: 'Completed',   statusColor: colors.success },
  { id: 'WO-004', title: 'Roof Inspection',        address: '321 Elm St, Fort Mill, SC',    status: 'Pending',     statusColor: '#f59e0b' },
];

export default function WorkOrdersPlaceholder() {
  useSetNavigationUI(UI.main);
  const navigation = useNavigation<Nav>();

  return (
    <MainFrame>
      <View style={styles.container}>
        <Text style={styles.title}>Work Orders</Text>

        {mockOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('JobDetail', { jobId: order.id, workOrderId: order.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: order.statusColor + '22', borderColor: order.statusColor }]}>
                <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
              </View>
            </View>
            <Text style={styles.orderTitle}>{order.title}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.addressText}>{order.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.arrow} />
          </TouchableOpacity>
        ))}

        <Text style={styles.notice}>⚠️ Jonathan — replace with your real Work Orders screen</Text>
      </View>
    </MainFrame>
  );
}

const styles = StyleSheet.create({
  container:   { width: '90%', gap: spacing.sm, paddingVertical: spacing.md },
  title:       { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.textWhite, marginBottom: spacing.xs },
  card:        { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId:     { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  statusBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText:  { fontFamily: fonts.bold, fontSize: fontSize.xs },
  orderTitle:  { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.textWhite },
  addressRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  arrow:       { position: 'absolute', right: spacing.md, top: '50%' },
  notice:      { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

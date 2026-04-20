/**
 * components/BottomNavigation.tsx — Bottom tab bar (Troy)
 *
 * Three tabs matching the approved Field Force design:
 *   Home        → Dashboard  (Charlie's screen)
 *   Work Orders → WorkOrders (Jonathan's screen)
 *   Contact     → Contact    (future screen — tab visible per design)
 *
 * Active tab highlighted in primary orange.
 * JobDetail is treated as a child of WorkOrders, so Jonathan's
 * tab stays lit while a job detail is open.
 *
 * ── TEAMMATE NOTES ───────────────────────────────────────────
 * Charlie / Jonathan:
 *   Add <BottomNavigation /> at the bottom of each of your screens.
 *   Active-tab highlighting is automatic — nothing else needed.
 * ─────────────────────────────────────────────────────────────
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts } from '../constants/theme';

type NavItem = {
  icon:       keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label:      string;
  screen:     string;
};

const NAV_ITEMS: NavItem[] = [
  {
    icon:       'home-outline',
    iconActive: 'home',
    label:      'Home',
    screen:     'Dashboard',
  },
  {
    icon:       'document-text-outline',
    iconActive: 'document-text',
    label:      'Work Orders',
    screen:     'WorkOrders',
  },
  {
    icon:       'chatbubble-outline',
    iconActive: 'chatbubble',
    label:      'Contact',
    // TODO (team): Create a Contact screen and add it to App.tsx
    screen:     'Contact',
  },
];

export function BottomNavigation() {
  const navigation = useNavigation<any>();
  const route      = useRoute();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          route.name === item.screen ||
          (item.screen === 'WorkOrders' && route.name === 'JobDetail');

        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.tab}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    backgroundColor:   colors.card,
    borderTopWidth:    1,
    borderTopColor:    colors.border,
    paddingTop:        spacing.sm,
    paddingBottom:     spacing.md,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             3,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize:   fontSize.tiny,
    color:      colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color:      colors.primary,
  },
});
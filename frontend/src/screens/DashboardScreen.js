import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const initial = user?.username ? user.username[0].toUpperCase() : '?';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />

      {/* ── Header bar ── */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.username ?? 'Contractor'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{user?.role ?? 'unknown'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardDot} />
          <Text style={styles.cardTitle}>Field Operations</Text>
          <Text style={styles.cardBody}>
            No active work orders assigned. Check back soon or contact your
            vendor manager for updates.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.cardTitle}>Offline Access</Text>
          <Text style={styles.cardBody}>
            Set your offline PIN in settings to access the app without
            connectivity in the field.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DARK = '#0A1628';
const BRAND = '#0066B2';
const BG = '#F0F2F5';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: DARK,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Body ────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },

  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});

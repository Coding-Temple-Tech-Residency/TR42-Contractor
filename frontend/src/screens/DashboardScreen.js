import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Welcome{user?.username ? `, ${user.username}` : ''}
      </Text>
      <Text style={styles.role}>{user?.role ?? ''}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0057A8', marginBottom: 4 },
  role: { fontSize: 15, color: '#555', marginBottom: 32, textTransform: 'capitalize' },
  logoutButton: {
    backgroundColor: '#C0392B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

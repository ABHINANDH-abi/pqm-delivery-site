import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/auth.store';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Rider Dashboard</Text>
            <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Rider Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.badge}>{user?.role}</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>🛵 Stage 2: Authentication Active</Text>
          <Text style={styles.statusText}>
            You are securely logged into the delivery partner app. Order assignment, pickup notifications, and navigation will be built in Stage 6.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  badge: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 18,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 20,
  },
});

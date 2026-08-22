import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { deliveryApi, DeliveryOrder, OrderStatus } from '../../api/delivery.api';

export default function DeliveryHomeScreen() {
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'AVAILABLE'>('ASSIGNED');
  const [assignedOrders, setAssignedOrders] = useState<DeliveryOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        deliveryApi.getAssignedOrders(),
        deliveryApi.getAvailableOrders(),
      ]);
      setAssignedOrders(assigned);
      setAvailableOrders(available);
    } catch (err) {
      console.log('Failed to fetch delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOnline = async (val: boolean) => {
    setIsOnline(val);
    try {
      await deliveryApi.updateLocation(12.9716, 77.5946, val);
    } catch (err) {
      console.log('Failed to update online status:', err);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionId(orderId);
      await deliveryApi.assignOrder(orderId);
      Alert.alert('Order Accepted!', 'You have been assigned to deliver this order.');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to accept order');
    } finally {
      setActionId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionId(orderId);
      await deliveryApi.updateStatus(orderId, nextStatus);
      Alert.alert('Status Updated', `Order status changed to ${nextStatus}`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update delivery status');
    } finally {
      setActionId(null);
    }
  };

  const displayedOrders = activeTab === 'ASSIGNED' ? assignedOrders : availableOrders;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>PQM Driver Console</Text>
          <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
        </View>

        <View style={styles.onlineContainer}>
          <Text style={styles.onlineLabel}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ASSIGNED' && styles.tabActive]}
          onPress={() => setActiveTab('ASSIGNED')}
        >
          <Text style={[styles.tabText, activeTab === 'ASSIGNED' && styles.tabTextActive]}>
            My Deliveries ({assignedOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'AVAILABLE' && styles.tabActive]}
          onPress={() => setActiveTab('AVAILABLE')}
        >
          <Text style={[styles.tabText, activeTab === 'AVAILABLE' && styles.tabTextActive]}>
            Available Pickup ({availableOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading && displayedOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Fetching delivery stream...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {displayedOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🛵</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'ASSIGNED' ? 'No active delivery assignments' : 'No orders awaiting driver'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ASSIGNED'
                  ? 'Switch to Available Pickup tab to claim incoming orders.'
                  : 'Check back in a moment as kitchen prepares new orders.'}
              </Text>
            </View>
          ) : (
            displayedOrders.map((order) => {
              const isBusy = actionId === order.id;

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Card Top */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.statusBadge}>{order.status}</Text>
                    </View>

                    <View style={styles.totalBadge}>
                      <Text style={styles.totalLabel}>COD AMOUNT</Text>
                      <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Customer Info */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>CUSTOMER</Text>
                    <Text style={styles.customerName}>{order.customer.name}</Text>
                    {order.customer.phone && (
                      <Text style={styles.customerPhone}>📞 {order.customer.phone}</Text>
                    )}
                  </View>

                  {/* Address Snapshot */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>DELIVERY ADDRESS 📍</Text>
                    <Text style={styles.addressText}>{order.deliveryAddressText}</Text>
                  </View>

                  {/* Items List */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>ORDER ITEMS</Text>
                    <Text style={styles.itemsSummary}>
                      {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionContainer}>
                    {activeTab === 'AVAILABLE' ? (
                      <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => handleAcceptOrder(order.id)}
                        disabled={isBusy}
                        activeOpacity={0.8}
                      >
                        {isBusy ? (
                          <ActivityIndicator color="#0F172A" />
                        ) : (
                          <Text style={styles.claimButtonText}>Accept Delivery 🛵</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.driverActionsRow}>
                        {order.status !== 'PICKED_UP' && order.status !== 'OUT_FOR_DELIVERY' && (
                          <TouchableOpacity
                            style={styles.actionBtnSecondary}
                            onPress={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                            disabled={isBusy}
                          >
                            <Text style={styles.actionTextSecondary}>Order Picked Up 📦</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.actionBtnPrimary}
                          onPress={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          disabled={isBusy}
                        >
                          <Text style={styles.actionTextPrimary}>Mark Delivered ✅</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  greeting: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 6,
    marginLeft: 4,
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 11,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  orderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  infoSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  customerPhone: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  addressText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  itemsSummary: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionContainer: {
    marginTop: 8,
  },
  claimButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  driverActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionTextSecondary: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 13,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionTextPrimary: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});

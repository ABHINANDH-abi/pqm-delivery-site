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
  Linking,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { deliveryApi, DeliveryOrder, OrderStatus } from '../../api/delivery.api';
import { pushNotification } from '../../utils/notification';

type MainTab = 'DELIVERIES' | 'EARNINGS' | 'PROFILE';
type SubTab = 'ASSIGNED' | 'AVAILABLE';

export default function DeliveryHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [mainTab, setMainTab] = useState<MainTab>('DELIVERIES');
  const [subTab, setSubTab] = useState<SubTab>('ASSIGNED');
  
  const [assignedOrders, setAssignedOrders] = useState<DeliveryOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [prevAvailableCount, setPrevAvailableCount] = useState<number>(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        deliveryApi.getAssignedOrders(),
        deliveryApi.getAvailableOrders(),
      ]);

      if (available.length > prevAvailableCount && prevAvailableCount > 0) {
        const latest = available[0];
        if (latest) {
          pushNotification.notifyNewOrderAlert(latest.id, latest.deliveryAddressText, latest.totalAmount);
        }
      }
      setPrevAvailableCount(available.length);
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
      await deliveryApi.updateLocation(11.0168, 76.9558, val);
    } catch (err) {
      console.log('Failed to update online status:', err);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionId(orderId);
      await deliveryApi.assignOrder(orderId);
      Alert.alert('Order Claimed!', 'Order assigned to you. Head to restaurant for pickup.');
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
      Alert.alert('Status Updated', `Order status updated to ${nextStatus}`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update delivery status');
    } finally {
      setActionId(null);
    }
  };

  // Filter Active vs Delivered Orders
  const activeAssigned = assignedOrders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const completedOrders = assignedOrders.filter((o) => o.status === 'DELIVERED');

  // Calculate Money Earned (@ ₹20/km per trip)
  const totalMoneyEarned = completedOrders.reduce((sum, order) => {
    const fee = typeof order.deliveryFee === 'string' ? parseFloat(order.deliveryFee) : (order.deliveryFee || 50);
    return sum + fee;
  }, 0);

  const totalKmTraveled = completedOrders.reduce((sum, order) => {
    const fee = typeof order.deliveryFee === 'string' ? parseFloat(order.deliveryFee) : (order.deliveryFee || 50);
    return sum + Math.max(1, Math.round(fee / 20));
  }, 0);

  const displayedOrders = subTab === 'ASSIGNED' ? activeAssigned : availableOrders;

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
        </View>
      </View>

      {/* Main Content Area based on Selected Bottom Tab */}
      <View style={styles.mainContent}>
        {/* TAB 1: DELIVERIES */}
        {mainTab === 'DELIVERIES' && (
          <View style={{ flex: 1 }}>
            {/* Top Sub-Filter Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, subTab === 'ASSIGNED' && styles.tabActive]}
                onPress={() => setSubTab('ASSIGNED')}
              >
                <Text style={[styles.tabText, subTab === 'ASSIGNED' && styles.tabTextActive]}>
                  My Deliveries ({activeAssigned.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, subTab === 'AVAILABLE' && styles.tabActive]}
                onPress={() => setSubTab('AVAILABLE')}
              >
                <Text style={[styles.tabText, subTab === 'AVAILABLE' && styles.tabTextActive]}>
                  Available Pickups ({availableOrders.length})
                </Text>
              </TouchableOpacity>
            </View>

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
                      {subTab === 'ASSIGNED' ? 'No active delivery assignments' : 'No orders awaiting pickup'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {subTab === 'ASSIGNED'
                        ? 'Switch to Available Pickups tab to claim incoming kitchen orders.'
                        : 'Check back in a moment as kitchen prepares new orders.'}
                    </Text>
                  </View>
                ) : (
                  displayedOrders.map((order) => {
                    const isBusy = actionId === order.id;

                    return (
                      <View key={order.id} style={styles.orderCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.statusBadge}>{order.status}</Text>
                          </View>

                          <View style={styles.totalBadge}>
                            <Text style={styles.totalLabel}>DELIVERY EARNING</Text>
                            <Text style={styles.totalValue}>+₹{order.deliveryFee || 50}</Text>
                          </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Customer Info */}
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionLabel}>CUSTOMER</Text>
                          <Text style={styles.customerName}>{order.customer.name}</Text>
                          {order.customer.phone && (
                            <TouchableOpacity
                              onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
                            >
                              <Text style={styles.customerPhone}>📞 {order.customer.phone}</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Address Snapshot */}
                        <View style={styles.infoSection}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.sectionLabel}>DELIVERY ADDRESS 📍</Text>
                            <TouchableOpacity
                              onPress={() => {
                                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  order.deliveryAddressText
                                )}`;
                                Linking.openURL(mapsUrl).catch(() => {
                                  Alert.alert('Error', 'Unable to open Google Maps on device');
                                });
                              }}
                              style={{
                                backgroundColor: '#1E293B',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: '#334155',
                              }}
                            >
                              <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '700' }}>
                                🗺️ Open Google Maps
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.addressText}>{order.deliveryAddressText}</Text>
                        </View>

                        {/* Items List */}
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionLabel}>ORDER ITEMS</Text>
                          <Text style={styles.itemsSummary}>
                            {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </Text>
                        </View>

                        {/* Driver Action Buttons */}
                        <View style={styles.actionContainer}>
                          {subTab === 'AVAILABLE' ? (
                            <TouchableOpacity
                              style={styles.claimButton}
                              activeOpacity={0.8}
                              onPress={() => handleAcceptOrder(order.id)}
                              disabled={isBusy}
                            >
                              {isBusy ? (
                                <ActivityIndicator color="#0F172A" />
                              ) : (
                                <Text style={styles.claimButtonText}>Accept Order & Start Delivery 🚀</Text>
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.driverActionsRow}>
                              {order.status === 'ASSIGNED' || order.status === 'READY' ? (
                                <TouchableOpacity
                                  style={styles.actionBtnPrimary}
                                  onPress={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                                  disabled={isBusy}
                                >
                                  <Text style={styles.actionTextPrimary}>Mark Picked Up 📦</Text>
                                </TouchableOpacity>
                              ) : null}

                              {order.status === 'PICKED_UP' ? (
                                <TouchableOpacity
                                  style={styles.actionBtnPrimary}
                                  onPress={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                                  disabled={isBusy}
                                >
                                  <Text style={styles.actionTextPrimary}>On The Way 🛵</Text>
                                </TouchableOpacity>
                              ) : null}

                              {order.status === 'OUT_FOR_DELIVERY' ? (
                                <TouchableOpacity
                                  style={[styles.actionBtnPrimary, { backgroundColor: '#10B981' }]}
                                  onPress={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                  disabled={isBusy}
                                >
                                  <Text style={styles.actionTextPrimary}>Mark Delivered ✅</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* TAB 2: ORDERS & MONEY EARNED */}
        {mainTab === 'EARNINGS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Total Money Earned Header Card */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>TOTAL MONEY EARNED 💰</Text>
              <Text style={styles.earningsValue}>₹{totalMoneyEarned}</Text>
              <Text style={styles.earningsSub}>Calculated @ ₹20 / km per trip</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{completedOrders.length}</Text>
                  <Text style={styles.statTitle}>Trips Done</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    ⭐{' '}
                    {completedOrders.filter((o) => o.rating).length > 0
                      ? (
                          completedOrders
                            .filter((o) => o.rating)
                            .reduce((sum, o) => sum + (o.rating || 0), 0) /
                          completedOrders.filter((o) => o.rating).length
                        ).toFixed(1)
                      : '5.0'}
                  </Text>
                  <Text style={styles.statTitle}>Avg Rating</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    ₹{completedOrders.length > 0 ? Math.round(totalMoneyEarned / completedOrders.length) : 0}
                  </Text>
                  <Text style={styles.statTitle}>Avg / Order</Text>
                </View>
              </View>
            </View>

            {/* Completed Orders History Section */}
            <Text style={styles.historyTitle}>Delivery History & Customer Ratings ({completedOrders.length})</Text>

            {completedOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📜</Text>
                <Text style={styles.emptyTitle}>No completed deliveries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Deliver your first order to start building your earnings history!
                </Text>
              </View>
            ) : (
              completedOrders.map((order) => (
                <View key={order.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.deliveredTime}>
                        Delivered • {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.earnedBadge}>
                      <Text style={styles.earnedText}>+₹{order.deliveryFee || 50} Earned</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.historyCustomer}>Customer: {order.customer.name}</Text>
                  <Text style={styles.historyAddress}>📍 {order.deliveryAddressText}</Text>
                  <Text style={styles.historyItems}>
                    📦 {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </Text>

                  {/* Customer Rating & Feedback Comment */}
                  {order.rating ? (
                    <View
                      style={{
                        marginTop: 10,
                        backgroundColor: '#0F172A',
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#334155',
                      }}
                    >
                      <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>
                        {'⭐'.repeat(order.rating)} Customer Rating: {order.rating}/5
                      </Text>
                      {order.feedback ? (
                        <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>
                          "{order.feedback}"
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* TAB 3: DRIVER PROFILE */}
        {mainTab === 'PROFILE' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(user?.name || 'D').slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{user?.name || 'Delivery Partner'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>APPROVED DELIVERY PARTNER 🛵</Text>
              </View>

              <View style={styles.profileDetailsList}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Rate / km</Text>
                  <Text style={styles.profileRowVal}>₹20 per kilometer</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Vehicle Type</Text>
                  <Text style={styles.profileRowVal}>Motorcycle / Scooter</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileRowLabel}>Duty Status</Text>
                  <Text style={[styles.profileRowVal, { color: isOnline ? '#10B981' : '#EF4444' }]}>
                    {isOnline ? 'Online (Accepting Orders)' : 'Offline'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.exitButton} onPress={logout} activeOpacity={0.8}>
                <Text style={styles.exitButtonText}>Sign Out of Driver App</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ANCHORED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity
          style={[styles.navItem, mainTab === 'DELIVERIES' && styles.navItemActive]}
          onPress={() => setMainTab('DELIVERIES')}
          activeOpacity={0.7}
        >
          <Text style={styles.navEmoji}>🛵</Text>
          <Text style={[styles.navLabel, mainTab === 'DELIVERIES' && styles.navLabelActive]}>
            Deliveries ({activeAssigned.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, mainTab === 'EARNINGS' && styles.navItemActive]}
          onPress={() => setMainTab('EARNINGS')}
          activeOpacity={0.7}
        >
          <Text style={styles.navEmoji}>💰</Text>
          <Text style={[styles.navLabel, mainTab === 'EARNINGS' && styles.navLabelActive]}>
            Orders & Earnings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, mainTab === 'PROFILE' && styles.navItemActive]}
          onPress={() => setMainTab('PROFILE')}
          activeOpacity={0.7}
        >
          <Text style={styles.navEmoji}>👤</Text>
          <Text style={[styles.navLabel, mainTab === 'PROFILE' && styles.navLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  greeting: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineLabel: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  mainContent: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 10,
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10B981',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
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
  // EARNINGS STYLES
  earningsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  earningsValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
  },
  earningsSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
  },
  statTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  deliveredTime: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  earnedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  earnedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  historyCustomer: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  historyAddress: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  historyItems: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  // PROFILE STYLES
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  profileDetailsList: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileRowLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  profileRowVal: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  exitButton: {
    marginTop: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 14,
  },
  // BOTTOM NAVIGATION BAR
  bottomNavContainer: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#F59E0B',
  },
  navEmoji: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
});

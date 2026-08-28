import React, { useEffect, useState, useRef } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { deliveryApi, DeliveryOrder, OrderStatus } from '../../api/delivery.api';
import { pushNotification } from '../../utils/notification';
import { notificationsApi, AppNotification } from '../../api/notifications.api';

type MainTab = 'DELIVERIES' | 'EARNINGS' | 'PROFILE';
type SubTab = 'ASSIGNED' | 'AVAILABLE';

const playDispatchSound = () => {
  try {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
};

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
  
  // Rider Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [alertPopupOrder, setAlertPopupOrder] = useState<DeliveryOrder | null>(null);

  const prevAvailableCountRef = useRef<number>(0);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getMyNotifications();
      setNotifications(data || []);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        deliveryApi.getAssignedOrders(),
        deliveryApi.getAvailableOrders(),
      ]);

      if (available.length > prevAvailableCountRef.current && prevAvailableCountRef.current >= 0) {
        const latest = available[0];
        if (latest) {
          playDispatchSound();
          setAlertPopupOrder(latest);
          pushNotification.notifyNewOrderAlert(latest.id, latest.deliveryAddressText, latest.totalAmount);
        }
      }

      prevAvailableCountRef.current = available.length;
      setAssignedOrders(assigned);
      setAvailableOrders(available);
      fetchNotifications();
    } catch (err) {
      console.log('Failed to fetch delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pushNotification.requestPermission();
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000); // 4-second fast refresh loop

    const gpsInterval = setInterval(() => {
      if (isOnline && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            deliveryApi.updateLocation(pos.coords.latitude, pos.coords.longitude, true).catch(() => {});
          },
          () => {
            deliveryApi.updateLocation(11.0168, 76.9558, true).catch(() => {});
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(gpsInterval);
    };
  }, [isOnline]);

  const handleToggleOnline = async (val: boolean) => {
    setIsOnline(val);
    if (val) {
      pushNotification.requestPermission();
    }
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

  const [deliveryModalOrder, setDeliveryModalOrder] = useState<DeliveryOrder | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionId(orderId);
      await deliveryApi.updateStatus(orderId, nextStatus);
      Alert.alert('Status Updated 🛵', `Order status updated to ${nextStatus.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update delivery status');
    } finally {
      setActionId(null);
    }
  };

  const handleVerifyDeliveryOtp = async () => {
    if (!deliveryModalOrder) return;
    const expectedOtp = deliveryModalOrder.id.slice(-4).toUpperCase();
    if (enteredOtp.trim().toUpperCase() !== expectedOtp) {
      Alert.alert(
        'Incorrect OTP ❌',
        `The 4-digit Delivery OTP entered (${enteredOtp}) does not match. Please ask customer for their 4-digit Delivery PIN shown in their app (${expectedOtp}).`
      );
      return;
    }

    try {
      setVerifyingOtp(true);
      await deliveryApi.updateStatus(deliveryModalOrder.id, 'DELIVERED');
      Alert.alert(
        'Delivery Verified & Completed! 🎉',
        `Order #${expectedOtp} verified with Customer OTP! Delivery payment credited to your earnings.`
      );
      setDeliveryModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to complete delivery');
    } finally {
      setVerifyingOtp(false);
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Rider Notification Bell Button */}
          <TouchableOpacity
            onPress={() => setIsNotificationsOpen(true)}
            style={{
              backgroundColor: '#1E293B',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#334155',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <View style={{ backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
                  {notifications.filter((n) => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

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
      </View>

      {/* Main Content Area based on Selected Bottom Tab */}
      <View style={styles.mainContent}>
        {/* TAB 1: DELIVERIES */}
        {mainTab === 'DELIVERIES' && (
          <View style={{ flex: 1 }}>
            {/* Sticky Rider Dispatch Alert Banner */}
            {availableOrders.length > 0 && (
              <TouchableOpacity
                onPress={() => setSubTab('AVAILABLE')}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  borderColor: '#F59E0B',
                  borderWidth: 1.5,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 24 }}>🔔</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 13 }}>
                      🚨 NEW RIDER DISPATCH ALERT! ({availableOrders.length} Ready)
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                      Restaurant accepted Order #{availableOrders[0]?.id?.slice(-6)?.toUpperCase()}. Tap to view route & claim delivery!
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 11 }}>CLAIM ➔</Text>
                </View>
              </TouchableOpacity>
            )}

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

                        {/* Customer Info & Quick-Dial Buttons */}
                        <View style={styles.infoSection}>
                          <Text style={styles.sectionLabel}>CUSTOMER</Text>
                          <Text style={styles.customerName}>{order.customer.name}</Text>
                          
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {order.customer.phone ? (
                              <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
                                style={{
                                  flex: 1,
                                  backgroundColor: '#10B981',
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 10,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                }}
                              >
                                <Text style={{ fontSize: 13 }}>📞</Text>
                                <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>Call Customer</Text>
                              </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                              onPress={() => Linking.openURL('tel:+919876543210')}
                              style={{
                                flex: 1,
                                backgroundColor: '#38BDF8',
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>📞</Text>
                              <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>Call Kitchen</Text>
                            </TouchableOpacity>
                          </View>
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
                                  onPress={() => {
                                    setDeliveryModalOrder(order);
                                    setEnteredOtp('');
                                  }}
                                  disabled={isBusy}
                                >
                                  <Text style={styles.actionTextPrimary}>Verify Customer OTP & Deliver 🔑</Text>
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

      {/* Delivery Verification OTP Modal */}
      {deliveryModalOrder && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🔑 Delivery OTP Verification</Text>
              <Text style={styles.modalSub}>Ask customer for their 4-digit Delivery PIN shown in their app</Text>

              <View style={styles.modalOrderCard}>
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 14 }}>
                  Order #{deliveryModalOrder.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginTop: 4 }}>
                  Customer: {deliveryModalOrder.customer.name}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  Address: {deliveryModalOrder.deliveryAddressText}
                </Text>

                <View style={styles.paymentBox}>
                  <Text style={{ color: '#34D399', fontWeight: '800', fontSize: 13 }}>
                    {deliveryModalOrder.payment?.method === 'RAZORPAY'
                      ? '⚡ UPI / ONLINE PAID (₹' + deliveryModalOrder.totalAmount + ')'
                      : '💵 CASH ON DELIVERY — COLLECT ₹' + deliveryModalOrder.totalAmount + ' CASH'}
                  </Text>
                </View>
              </View>

              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                Enter Customer 4-Digit PIN:
              </Text>
              <TextInput
                style={styles.otpInput}
                placeholder="e.g. 8921"
                placeholderTextColor="#64748B"
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setDeliveryModalOrder(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalVerifyBtn}
                  onPress={handleVerifyDeliveryOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.modalVerifyText}>Verify & Deliver 🎉</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* RIDER DISPATCH ALERT POPUP MODAL */}
      {alertPopupOrder && (
        <Modal visible transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#1E293B', borderRadius: 24, padding: 24, width: '100%', maxWidth: 420, borderWidth: 2, borderColor: '#F59E0B' }}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>🔔</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#F59E0B', textAlign: 'center' }}>
                🚨 NEW DISPATCH ALERT!
              </Text>
              <Text style={{ fontSize: 13, color: '#FFFFFF', textAlign: 'center', marginTop: 6, fontWeight: '700' }}>
                Restaurant Accepted Order #{alertPopupOrder.id.slice(-6).toUpperCase()}
              </Text>
              
              <View style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 14, marginVertical: 16, borderWidth: 1, borderColor: '#334155' }}>
                <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 14 }}>
                  Delivery Fee Earning: +₹{alertPopupOrder.deliveryFee || 50}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                  Customer: {alertPopupOrder.customer?.name}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  Address: {alertPopupOrder.deliveryAddressText}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setAlertPopupOrder(null)}
                  style={{ flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '700' }}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const targetId = alertPopupOrder.id;
                    setAlertPopupOrder(null);
                    handleAcceptOrder(targetId);
                  }}
                  style={{ flex: 1.5, backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 13 }}>CLAIM ORDER NOW 🚀</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* RIDER NOTIFICATION INBOX MODAL */}
      {isNotificationsOpen && (
        <Modal visible transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>🔔 Rider Notification Alerts</Text>
                <TouchableOpacity onPress={() => setIsNotificationsOpen(false)}>
                  <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 14 }}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>No alerts yet. Notifications will appear when kitchen accepts orders.</Text>
                  </View>
                ) : (
                  notifications.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: item.isRead ? '#0F172A' : 'rgba(245, 158, 11, 0.1)',
                        borderColor: item.isRead ? '#334155' : '#F59E0B',
                        borderWidth: 1,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: item.isRead ? '#94A3B8' : '#F59E0B', fontWeight: '800', fontSize: 13 }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                        {item.body}
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 10, marginTop: 6 }}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  modalOrderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentBox: {
    marginTop: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 8,
    borderRadius: 8,
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  modalVerifyBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalVerifyText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 13,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { ordersApi, Order, OrderStatus } from '../../api/orders.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'OrderTracking'>;

const LIFECYCLE_STEPS: { key: OrderStatus; label: string; sub: string }[] = [
  { key: 'PLACED', label: 'Order Received', sub: 'Sent to restaurant kitchen' },
  { key: 'ACCEPTED', label: 'Order Accepted', sub: 'Chef acknowledged your order' },
  { key: 'PREPARING', label: 'Preparing Food', sub: 'Fresh ingredients being cooked' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', sub: 'Rider is on the way to your location' },
  { key: 'DELIVERED', label: 'Delivered', sub: 'Enjoy your meal!' },
];

export default function OrderTrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edit Order Modal State
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editItems, setEditItems] = useState<{ productId: string; name: string; quantity: number }[]>([]);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const fetchOrderDetails = async () => {
    try {
      setRefreshing(true);
      const data = await ordersApi.getById(orderId);
      setOrder(data);
    } catch (err) {
      console.log('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const openEditModal = () => {
    if (!order) return;
    setEditNotes(order.notes || '');
    setEditItems(
      order.items.map((i) => ({
        productId: i.productId,
        name: i.productName,
        quantity: i.quantity,
      }))
    );
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!order) return;
    try {
      setSavingEdit(true);
      const activeItems = editItems.filter((i) => i.quantity > 0);
      if (activeItems.length === 0) {
        Alert.alert('Error', 'Order must contain at least 1 item.');
        setSavingEdit(false);
        return;
      }

      const updated = await ordersApi.editOrder(order.id, {
        notes: editNotes,
        items: activeItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      setOrder(updated);
      setEditModalVisible(false);
      Alert.alert('Order Updated! ✏️', 'Your order details and kitchen notes have been updated.');
    } catch (err: any) {
      Alert.alert('Edit Failed', err.response?.data?.error?.message || 'Failed to update order');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelOrder = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.cancel(orderId, 'Cancelled by customer');
            fetchOrderDetails();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error?.message || 'Failed to cancel order');
          }
        },
      },
    ]);
  };

  const getStepStatus = (stepKey: OrderStatus) => {
    if (!order) return 'PENDING';
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') return 'FAILED';

    const statusOrder: OrderStatus[] = [
      'PLACED',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentIndex > stepIndex) return 'COMPLETED';
    if (currentIndex === stepIndex) return 'ACTIVE';
    return 'PENDING';
  };

  const isEditable =
    order && !['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backText}>← Back Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Order Tracker 🚴</Text>
        <TouchableOpacity onPress={fetchOrderDetails} disabled={refreshing}>
          <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Fetching live order status...</Text>
        </View>
      ) : !order ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Order Not Found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order ID Banner */}
          <View style={styles.bannerCard}>
            <View>
              <Text style={styles.orderIdText}>Order #{order.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderDateText}>
                Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.estTimeBadge}>
              <Text style={styles.estTimeLabel}>EST. ARRIVAL</Text>
              <Text style={styles.estTimeValue}>25 - 35 Min</Text>
            </View>
          </View>

          {/* Edit Order Option Banner before OUT_FOR_DELIVERY */}
          {isEditable && (
            <TouchableOpacity style={styles.editBannerCard} onPress={openEditModal} activeOpacity={0.8}>
              <View>
                <Text style={styles.editBannerTitle}>✏️ Edit Order Items & Notes</Text>
                <Text style={styles.editBannerSub}>Allowed before order is Out for Delivery</Text>
              </View>
              <Text style={styles.editBannerBtnText}>Edit →</Text>
            </TouchableOpacity>
          )}

          {/* Google Maps Live Route Tracking Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapCardHeader}>
              <Text style={styles.mapTitle}>🗺️ Live Map Tracking</Text>
              <Text style={styles.distanceBadge}>3.2 KM • 28 MIN ETA</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.dotKitchen]} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>RESTAURANT ORIGIN</Text>
                  <Text style={styles.routeValue}>Qureshi Mandi Coimbatore</Text>
                </View>
              </View>

              <View style={styles.routeConnector} />

              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.dotCustomer]} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>DELIVERY ADDRESS</Text>
                  <Text style={styles.routeValue}>{order.deliveryAddressText}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cancellation / Rejection Banner if applicable */}
          {(order.status === 'CANCELLED' || order.status === 'REJECTED') && (
            <View style={styles.cancelledBox}>
              <Text style={styles.cancelledTitle}>
                {order.status === 'CANCELLED' ? '❌ Order Cancelled' : '⛔ Order Rejected'}
              </Text>
              <Text style={styles.cancelledSub}>{order.cancellationReason || 'Order could not be processed.'}</Text>
            </View>
          )}

          {/* Real-time Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Order Progress</Text>

            <View style={styles.timelineContainer}>
              {LIFECYCLE_STEPS.map((step, idx) => {
                const statusState = getStepStatus(step.key);
                const isLast = idx === LIFECYCLE_STEPS.length - 1;

                return (
                  <View key={step.key} style={styles.timelineStepRow}>
                    <View style={styles.timelineNodeCol}>
                      <View
                        style={[
                          styles.timelineCircle,
                          statusState === 'COMPLETED' && styles.circleCompleted,
                          statusState === 'ACTIVE' && styles.circleActive,
                          statusState === 'FAILED' && styles.circleFailed,
                        ]}
                      >
                        <Text style={styles.circleIcon}>
                          {statusState === 'COMPLETED' ? '✓' : statusState === 'ACTIVE' ? '●' : '○'}
                        </Text>
                      </View>

                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            statusState === 'COMPLETED' && styles.lineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.stepTitle,
                          statusState === 'ACTIVE' && styles.textActive,
                          statusState === 'COMPLETED' && styles.textCompleted,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.stepSub}>{step.sub}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Order Summary & Notes */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.summaryCard}>
              {order.items.map((i) => (
                <View key={i.id} style={styles.summaryRow}>
                  <Text style={styles.summaryItemName}>
                    {i.productName} x {i.quantity}
                  </Text>
                  <Text style={styles.summaryItemPrice}>₹{i.totalPrice}</Text>
                </View>
              ))}

              {order.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>KITCHEN NOTES 📝</Text>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              ) : null}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRowTotal}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
              </View>
            </View>

            {/* Edit Button Action */}
            {isEditable && (
              <TouchableOpacity
                style={styles.editActionBtn}
                activeOpacity={0.8}
                onPress={openEditModal}
              >
                <Text style={styles.editActionBtnText}>✏️ Edit Order Items & Notes</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button (only allowed when PLACED) */}
            {order.status === 'PLACED' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={handleCancelOrder}
              >
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Edit Order Modal */}
      {editModalVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Order ✏️</Text>
              <Text style={styles.modalSubtitle}>Modify item quantities or update kitchen notes</Text>

              {/* Items Quantity Adjuster */}
              <ScrollView style={{ maxHeight: 200, marginBottom: 14 }}>
                {editItems.map((item, idx) => (
                  <View key={item.productId} style={styles.editItemRow}>
                    <Text style={styles.editItemName}>{item.name}</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => {
                          const updated = [...editItems];
                          updated[idx]!.quantity = Math.max(0, updated[idx]!.quantity - 1);
                          setEditItems(updated);
                        }}
                      >
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperVal}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => {
                          const updated = [...editItems];
                          updated[idx]!.quantity += 1;
                          setEditItems(updated);
                        }}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Kitchen Notes */}
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                Kitchen & Delivery Notes:
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Extra spicy, no onions, call on arrival..."
                placeholderTextColor="#64748B"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveModalBtn}
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.saveModalText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  refreshText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  bannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  orderIdText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
  },
  orderDateText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  estTimeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  estTimeLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  estTimeValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  editBannerCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editBannerTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
  },
  editBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  editBannerBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  mapCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  mapTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  distanceBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  routeContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotKitchen: {
    backgroundColor: '#F59E0B',
  },
  dotCustomer: {
    backgroundColor: '#34D399',
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  routeValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#334155',
    marginLeft: 5,
    marginVertical: 4,
  },
  cancelledBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  cancelledTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelledSub: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 4,
  },
  timelineSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  timelineContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timelineStepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  circleActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  circleFailed: {
    backgroundColor: '#F87171',
    borderColor: '#F87171',
  },
  circleIcon: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: '#34D399',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  textActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  textCompleted: {
    color: '#FFFFFF',
  },
  stepSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItemName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryItemPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '800',
  },
  editActionBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editActionBtnText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 13,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: '#F87171',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  editItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  editItemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    backgroundColor: '#334155',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  stepperVal: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    padding: 12,
    fontSize: 13,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveModalText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});

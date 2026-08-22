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
                  <Text style={styles.routeValue}>PQM Kitchen & Gourmet Pizza, MG Road</Text>
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
                    {/* Left Timeline Node & Line */}
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.nodeCircle,
                          statusState === 'COMPLETED' && styles.nodeCompleted,
                          statusState === 'ACTIVE' && styles.nodeActive,
                          statusState === 'FAILED' && styles.nodeFailed,
                        ]}
                      >
                        {statusState === 'COMPLETED' ? (
                          <Text style={styles.nodeCheck}>✓</Text>
                        ) : statusState === 'ACTIVE' ? (
                          <View style={styles.nodeDotActive} />
                        ) : null}
                      </View>

                      {!isLast && (
                        <View
                          style={[
                            styles.nodeLine,
                            statusState === 'COMPLETED' && styles.nodeLineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    {/* Step Text Details */}
                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepTitle,
                          statusState === 'ACTIVE' && styles.stepTitleActive,
                          statusState === 'COMPLETED' && styles.stepTitleCompleted,
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

          {/* Address & Items Summary */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.detailsCard}>
              <Text style={styles.addressLabel}>DELIVERING TO</Text>
              <Text style={styles.addressText}>{order.deliveryAddressText}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Items Summary</Text>
            <View style={styles.itemsCard}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {item.productName} <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </Text>
                  <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
              </View>
            </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  orderDateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  estTimeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  estTimeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  estTimeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
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
    fontWeight: '800',
    fontSize: 15,
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
    borderWidth: 1,
    borderColor: '#334155',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
    marginRight: 10,
  },
  dotKitchen: { backgroundColor: '#F59E0B' },
  dotCustomer: { backgroundColor: '#10B981' },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#334155',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  routeValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  cancelledBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  cancelledTitle: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelledSub: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 4,
  },
  timelineSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  timelineContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    alignItems: 'center',
    marginRight: 14,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  nodeActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  nodeFailed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  nodeCheck: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  nodeDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  nodeLine: {
    width: 2,
    height: 36,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  nodeLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleActive: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 15,
  },
  stepTitleCompleted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  itemsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  itemQty: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  itemPrice: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 14,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { ordersApi, Order, OrderStatus } from '../../api/orders.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'OrderHistory'>;

export default function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Rating Modal state
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.log('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openRatingModal = (order: Order) => {
    setRatingModalOrder(order);
    setSelectedStars(order.rating || 5);
    setFeedbackText(order.feedback || '');
  };

  const handleRatingSubmit = async () => {
    if (!ratingModalOrder) return;
    try {
      setSubmittingRating(true);
      const updated = await ordersApi.rateOrder(ratingModalOrder.id, selectedStars, feedbackText);
      setOrders((prev) => prev.map((o) => (o.id === ratingModalOrder.id ? updated : o)));
      Alert.alert('Thank You! ⭐', 'Your delivery rating and feedback have been submitted.');
      setRatingModalOrder(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return <Text style={[styles.badge, styles.badgePlaced]}>PLACED</Text>;
      case 'ACCEPTED':
        return <Text style={[styles.badge, styles.badgeAccepted]}>ACCEPTED</Text>;
      case 'PREPARING':
        return <Text style={[styles.badge, styles.badgePreparing]}>PREPARING</Text>;
      case 'OUT_FOR_DELIVERY':
        return <Text style={[styles.badge, styles.badgeOut]}>OUT FOR DELIVERY</Text>;
      case 'DELIVERED':
        return <Text style={[styles.badge, styles.badgeDelivered]}>DELIVERED</Text>;
      case 'CANCELLED':
      case 'REJECTED':
        return <Text style={[styles.badge, styles.badgeCancelled]}>{status}</Text>;
      default:
        return <Text style={styles.badge}>{status}</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders 📜</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No past orders yet</Text>
              <Text style={styles.emptySubtitle}>Place your first food order to see it here.</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {getStatusBadge(order.status)}
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.itemsSummary}>
                    {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </Text>
                </TouchableOpacity>

                {/* Delivered Rating Section */}
                {order.status === 'DELIVERED' && (
                  <View style={styles.ratingSectionContainer}>
                    {order.rating ? (
                      <View style={styles.ratedBadgeBox}>
                        <Text style={styles.ratedStarsText}>
                          {'⭐'.repeat(order.rating)} ({order.rating}/5)
                        </Text>
                        {order.feedback ? (
                          <Text style={styles.ratedCommentText}>"{order.feedback}"</Text>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.rateButton}
                        activeOpacity={0.8}
                        onPress={() => openRatingModal(order)}
                      >
                        <Text style={styles.rateButtonText}>⭐ Rate Delivery Boy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                  >
                    <Text style={styles.trackText}>Track Order →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 5-Star Rating & Feedback Modal */}
      {ratingModalOrder && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate Your Delivery Boy ⭐</Text>
              <Text style={styles.modalSubtitle}>
                How was your experience for Order #{ratingModalOrder.id.slice(-6).toUpperCase()}?
              </Text>

              {/* Star Picker */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedStars(star)}
                    style={styles.starTouchable}
                  >
                    <Text style={[styles.starChar, star <= selectedStars && styles.starCharSelected]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingLabelText}>{selectedStars} of 5 Stars</Text>

              {/* Feedback Comment Box */}
              <TextInput
                style={styles.feedbackInput}
                placeholder="Write feedback for delivery boy (optional)..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={feedbackText}
                onChangeText={setFeedbackText}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setRatingModalOrder(null)}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitModalBtn}
                  onPress={handleRatingSubmit}
                  disabled={submittingRating}
                >
                  {submittingRating ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.submitModalText}>Submit Rating</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
  },
  orderDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    color: '#94A3B8',
    backgroundColor: '#0F172A',
  },
  badgePlaced: { color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeAccepted: { color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  badgePreparing: { color: '#C084FC', backgroundColor: 'rgba(192, 132, 252, 0.15)' },
  badgeOut: { color: '#FB923C', backgroundColor: 'rgba(251, 146, 60, 0.15)' },
  badgeDelivered: { color: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  badgeCancelled: { color: '#F87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  itemsSummary: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  ratingSectionContainer: {
    marginTop: 12,
  },
  rateButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 12,
  },
  ratedBadgeBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ratedStarsText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  ratedCommentText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  trackText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starTouchable: {
    padding: 4,
  },
  starChar: {
    fontSize: 34,
    color: '#475569',
  },
  starCharSelected: {
    color: '#F59E0B',
  },
  ratingLabelText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  feedbackInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 16,
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
  submitModalBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitModalText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});

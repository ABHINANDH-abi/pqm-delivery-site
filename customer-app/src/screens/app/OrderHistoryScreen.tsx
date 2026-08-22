import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ordersApi, Order, OrderStatus } from '../../api/orders.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'OrderHistory'>;

export default function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
        <Text style={styles.headerTitle}>Order History 📜</Text>
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
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
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

                <View style={styles.cardFooter}>
                  <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
                  <Text style={styles.trackText}>Track Order →</Text>
                </View>
              </TouchableOpacity>
            ))
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
});

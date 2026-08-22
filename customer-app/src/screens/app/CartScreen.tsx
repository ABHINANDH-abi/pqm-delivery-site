import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCartStore } from '../../store/cart.store';
import { addressApi, Address } from '../../api/address.api';
import { ordersApi } from '../../api/orders.api';
import { paymentsApi } from '../../api/payments.api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const {
    items,
    addItem,
    removeItem,
    clearCart,
    getSubtotal,
    getDeliveryFee,
    getTaxesAndCharges,
    getTotal,
  } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'RAZORPAY'>('CASH_ON_DELIVERY');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAddresses = async () => {
    try {
      const data = await addressApi.getMyAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0] || null;
      setSelectedAddress(defaultAddr);
    } catch (err) {
      console.log('Failed to fetch addresses:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const taxes = getTaxesAndCharges();
  const total = getTotal();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Delivery Address Required', 'Please select or add a delivery address to place your order.');
      navigation.navigate('Address');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create System Order
      const order = await ordersApi.create({
        addressId: selectedAddress.id,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
      });

      // 2. If Razorpay selected, process online payment verification
      if (paymentMethod === 'RAZORPAY') {
        const rzpData = await paymentsApi.createRazorpayOrder(order.id);

        await paymentsApi.verifyPayment({
          orderId: order.id,
          razorpayOrderId: rzpData.razorpayOrderId,
          razorpayPaymentId: `pay_${Date.now()}`,
          razorpaySignature: `mock_sig_${Date.now()}`,
        });
      }

      clearCart();
      navigation.navigate('OrderTracking', { orderId: order.id });
    } catch (err: any) {
      Alert.alert('Order Placement Failed', err.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart 🛒</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Explore our delicious food menu and add items to your cart.</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse Food Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cart Items List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Items ({items.length})</Text>
            {items.map(({ product, quantity }) => {
              const pPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
              return (
                <View key={product.id} style={styles.itemCard}>
                  <Image
                    source={{
                      uri:
                        product.imageUrl ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80',
                    }}
                    style={styles.itemImage}
                  />

                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                      <View
                        style={[
                          styles.vegDotBorder,
                          product.isVeg ? styles.borderVeg : styles.borderNonVeg,
                        ]}
                      >
                        <View style={[styles.vegDot, product.isVeg ? styles.bgVeg : styles.bgNonVeg]} />
                      </View>
                      <Text style={styles.itemName}>{product.name}</Text>
                    </View>
                    <Text style={styles.itemPrice}>₹{pPrice}</Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => removeItem(product.id)}
                    >
                      <Text style={styles.stepperText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => addItem(product)}>
                      <Text style={styles.stepperText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery Address Selection */}
          <View style={styles.section}>
            <View style={styles.addressHeader}>
              <Text style={styles.sectionTitle}>Delivery Address 📍</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Address')}>
                <Text style={styles.changeAddressText}>Manage / Add</Text>
              </TouchableOpacity>
            </View>

            {selectedAddress ? (
              <View style={styles.addressCard}>
                <View style={styles.addressLabelBadge}>
                  <Text style={styles.addressLabelText}>{selectedAddress.label}</Text>
                </View>
                <Text style={styles.addressLine}>{selectedAddress.addressLine1}</Text>
                <Text style={styles.addressCity}>
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noAddressCard}
                onPress={() => navigation.navigate('Address')}
              >
                <Text style={styles.noAddressTitle}>+ Add Delivery Address</Text>
                <Text style={styles.noAddressSub}>Select or add an address to continue checkout</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Payment Method Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method 💳</Text>
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('CASH_ON_DELIVERY')}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentEmoji}>💵</Text>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                  <Text style={styles.paymentSub}>Pay cash to driver upon delivery</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'CASH_ON_DELIVERY' && styles.radioActive,
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'RAZORPAY' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('RAZORPAY')}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentEmoji}>💳</Text>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentTitle}>Razorpay Online Payment</Text>
                  <Text style={styles.paymentSub}>UPI, Debit/Credit Card, NetBanking</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'RAZORPAY' && styles.radioActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bill Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Breakdown</Text>
            <View style={styles.billCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Subtotal</Text>
                <Text style={styles.billValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Text style={styles.billValue}>₹{deliveryFee}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>GST & Restaurant Charges (5%)</Text>
                <Text style={styles.billValue}>₹{taxes}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.billRowTotal}>
                <Text style={styles.totalLabel}>
                  To Pay ({paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'Online'})
                </Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Fixed Bottom Checkout Bar */}
      {items.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutTotalLabel}>Grand Total</Text>
            <Text style={styles.checkoutTotalValue}>₹{total}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            activeOpacity={0.8}
            onPress={handlePlaceOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.checkoutButtonText}>
                {paymentMethod === 'RAZORPAY' ? 'Pay Online & Order →' : 'Proceed to Order →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  clearText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  browseButtonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    objectFit: 'cover',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegDotBorder: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justify.content: 'center',
    borderRadius: 3,
  },
  borderVeg: { borderColor: '#10B981' },
  borderNonVeg: { borderColor: '#EF4444' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  bgVeg: { backgroundColor: '#10B981' },
  bgNonVeg: { backgroundColor: '#EF4444' },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperText: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '800',
  },
  quantityText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeAddressText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  addressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressLabelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  addressLabelText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  addressLine: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  addressCity: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  noAddressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  noAddressTitle: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 15,
  },
  noAddressSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  paymentMethodContainer: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentOptionActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  paymentEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  paymentSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
  },
  radioActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  billCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  billValue: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutTotalLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checkoutTotalValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  checkoutButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});

import { Alert, Vibration, Platform } from 'react-native';

export const pushNotification = {
  notifyNewOrderAlert: (orderId: string, address: string, totalAmount: number | string) => {
    const shortId = orderId.slice(-6).toUpperCase();
    const title = '🛵 NEW DELIVERY ORDER ALERT!';
    const message = `Order #${shortId} placed!\nDelivery to: ${address}\nEarnings/Total: ₹${totalAmount}\n\nTap Accept Order inside your driver app now.`;

    // High priority long vibration alert for drivers
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Vibration.vibrate([0, 800, 300, 800, 300, 1000]);
    }

    Alert.alert(title, message);
  },
};

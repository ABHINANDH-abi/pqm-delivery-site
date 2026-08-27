import { Alert, Vibration, Platform } from 'react-native';

export const pushNotification = {
  notifyOrderStatusChange: (orderId: string, status: string) => {
    const shortId = orderId.slice(-6).toUpperCase();
    let title = 'Order Update 📦';
    let message = `Your order #${shortId} status has changed to ${status}.`;

    if (status === 'ACCEPTED') {
      title = 'Order Accepted! 👩‍🍳';
      message = `Qureshi Mandi accepted Order #${shortId}. Preparation has started!`;
    } else if (status === 'PREPARING') {
      title = 'Food Being Prepared! 🍲';
      message = `Your meal for Order #${shortId} is being cooked fresh in the kitchen.`;
    } else if (status === 'OUT_FOR_DELIVERY') {
      title = 'Out for Delivery! 🛵';
      message = `Rider is on the way with your Order #${shortId}! Get ready.`;
    } else if (status === 'DELIVERED') {
      title = 'Order Delivered! 🎉';
      message = `Order #${shortId} has been delivered. Enjoy your food! Please leave a review.`;
    }

    // Trigger device haptic vibration pattern
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    Alert.alert(title, message);
  },
};

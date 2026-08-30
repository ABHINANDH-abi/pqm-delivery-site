import { Alert, Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground & background notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Create High-Priority Android System Notification Channel for Customer Order Updates
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('customer_alerts', {
    name: 'Customer Order Status Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
    sound: 'default', // Plays OS chime sound
    enableVibrate: true,
    showBadge: true,
  }).catch((e) => console.log('Notification channel error:', e));
}

export const pushNotification = {
  notifyOrderStatusChange: async (orderId: string, status: string) => {
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

    // 1. Trigger device haptic vibration pattern
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {}

    // 2. Schedule OS Status Bar Banner Notification with Audio Chime
    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: message,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 400, 200, 400],
            data: { orderId },
          } as any,
          trigger: null, // Instant delivery
        });
      } catch (e) {
        console.log('Customer native notification error:', e);
      }
    }

    Alert.alert(title, message);
  },
};

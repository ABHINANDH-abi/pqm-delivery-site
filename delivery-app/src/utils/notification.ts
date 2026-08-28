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

// Create High-Priority Android System Notification Channel with Audio Chime & Vibration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('order_alerts', {
    name: 'New Order Driver Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 1000],
    sound: 'default', // OS Chime sound (like Google Pay payment audio)
    enableVibrate: true,
    showBadge: true,
  }).catch((e) => console.log('Notification channel error:', e));
}

export const pushNotification = {
  getPermissionState: async (): Promise<string> => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
      } catch (e) {
        return 'granted';
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'granted';
  },

  requestPermission: async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      } catch (e) {
        return true;
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          return true;
        } else {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      } catch (e) {
        console.log('Web Notification permission error:', e);
      }
    }
    return true;
  },

  sendOSNotification: async (title: string, bodyText: string, tag?: string) => {
    // 1. Phone Hardware Vibration Pattern
    try {
      Vibration.vibrate([0, 1000, 400, 1000, 400, 1500]);
    } catch (e) {}

    // 2. Android / iOS Native System Notification with Audio Chime (Google Pay Style)
    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: bodyText,
            sound: 'default', // Google Pay / System Chime sound
            vibrate: [0, 500, 250, 500, 250, 1000],
            data: { tag: tag || `dispatch-${Date.now()}` },
          },
          trigger: null, // Deliver immediately
        });
      } catch (err) {
        console.log('Native notification error:', err);
      }
      return;
    }

    // 3. Web ServiceWorker Status Bar Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          if ('navigator' in window && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body: bodyText,
                icon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
                badge: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
                tag: tag || `dispatch-notice-${Date.now()}`,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
              } as any).catch(() => {
                new Notification(title, { body: bodyText, tag });
              });
            });
          } else {
            const systemNotice = new Notification(title, {
              body: bodyText,
              icon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
              tag: tag || `dispatch-notice-${Date.now()}`,
              requireInteraction: true,
            } as any);

            systemNotice.onclick = () => {
              try {
                window.focus();
              } catch (e) {}
            };
          }
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body: bodyText, tag });
            }
          });
        }
      } catch (e) {
        console.log('System Notification dispatch error:', e);
      }
    }
  },

  notifyNewOrderAlert: (orderId: string, address: string, totalAmount: number | string) => {
    const shortId = orderId.slice(-6).toUpperCase();
    const title = '🔔 PQM Driver Alert: NEW ORDER READY!';
    const bodyText = `Order #${shortId} accepted by kitchen (+₹50 fee).\nDelivery to: ${address}\nTap to claim order!`;

    pushNotification.sendOSNotification(title, bodyText, `order-dispatch-${orderId}`);
    Alert.alert(title, bodyText);
  },
};

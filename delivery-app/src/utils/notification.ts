import { Alert, Vibration, Platform } from 'react-native';

export const pushNotification = {
  requestPermission: async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          return true;
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      } catch (e) {
        console.log('Web Notification permission error:', e);
      }
    }
    return true;
  },

  notifyNewOrderAlert: (orderId: string, address: string, totalAmount: number | string) => {
    const shortId = orderId.slice(-6).toUpperCase();
    const title = '🛵 PQM Driver Alert: NEW ORDER READY!';
    const bodyText = `Order #${shortId} accepted by restaurant (+₹50 fee).\nDelivery to: ${address}\nTap to claim order!`;

    // 1. Phone Hardware Vibration Pattern for Pocket Alert
    try {
      Vibration.vibrate([0, 1000, 400, 1000, 400, 1500]);
    } catch (e) {}

    // 2. OS System Status Bar Banner Notification (Web Push API / OS Background Banner)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          const systemNotice = new Notification(title, {
            body: bodyText,
            icon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
            badge: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
            tag: `order-dispatch-${orderId}`,
            requireInteraction: true,
          } as any);

          systemNotice.onclick = () => {
            if (typeof window !== 'undefined') {
              window.focus();
            }
          };
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body: bodyText });
            }
          });
        }
      } catch (e) {
        console.log('System Notification dispatch error:', e);
      }
    }

    // 3. Fallback Foreground Alert
    Alert.alert(title, bodyText);
  },
};

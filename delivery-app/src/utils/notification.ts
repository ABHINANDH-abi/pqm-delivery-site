import { Alert, Vibration } from 'react-native';

export const pushNotification = {
  getPermissionState: (): string => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'granted';
  },

  requestPermission: async (): Promise<boolean> => {
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

  sendOSNotification: (title: string, bodyText: string, tag?: string) => {
    // 1. Phone Hardware Vibration Pattern
    try {
      Vibration.vibrate([0, 1000, 400, 1000, 400, 1500]);
    } catch (e) {}

    // 2. OS System Status Bar Banner Notification
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
    const title = '🛵 PQM Driver Alert: NEW ORDER READY!';
    const bodyText = `Order #${shortId} accepted by kitchen (+₹50 fee).\nDelivery to: ${address}\nTap to claim order!`;

    pushNotification.sendOSNotification(title, bodyText, `order-dispatch-${orderId}`);
    Alert.alert(title, bodyText);
  },
};

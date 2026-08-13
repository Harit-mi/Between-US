// Safe wrapper for haptic vibration feedback
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

// Request and fire browser push notification (Compatible with iOS, Android & Desktop)
export async function sendBrowserNotification(title: string, body: string, icon = '❤️') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    let permission = Notification.permission;
    if (permission !== 'granted' && permission !== 'denied') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      // Check for active Service Worker for iOS/Android Mobile Web Push
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: 'between-us-notif-' + Date.now(),
            });
            return;
          }
        } catch {
          // Fall back to standard Notification
        }
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'between-us-notif-' + Date.now(),
      });
    }
  } catch (err) {
    console.warn('Browser notification error:', err);
  }
}

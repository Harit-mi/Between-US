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

// Request and fire browser push-style notification
export async function sendBrowserNotification(title: string, body: string, icon = '❤️') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: `/pwa-192x192.png`,
        badge: `/pwa-192x192.png`,
        tag: 'touch-notification',
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: `/pwa-192x192.png`,
          badge: `/pwa-192x192.png`,
          tag: 'touch-notification',
        });
      }
    }
  } catch (err) {
    console.warn('Browser notification error:', err);
  }
}

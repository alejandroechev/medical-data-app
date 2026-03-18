export function isNotificationSupported(): boolean {
  return typeof Notification !== 'undefined' && Notification !== null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'denied'> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/pwa-192x192.svg', ...options });
}

/**
 * Register for Periodic Background Sync to check pickup alerts
 * when the app is closed. Only works on Chrome Android.
 * Graceful no-op on unsupported browsers.
 */
export async function registerPeriodicSync(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    // Check if periodic sync is supported
    if (!('periodicSync' in registration)) return;

    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });

    if (status.state !== 'granted') return;

    await (registration as ServiceWorkerRegistration & {
      periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    }).periodicSync.register('check-pickup-alerts', {
      minInterval: 12 * 60 * 60 * 1000, // 12 hours
    });
  } catch {
    // Silently fail — periodic sync is a progressive enhancement
  }
}

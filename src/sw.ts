/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching — VitePWA injects the manifest here
precacheAndRoute(self.__WB_MANIFEST);

// Periodic Background Sync for pickup notifications (Chrome Android)
self.addEventListener('periodicsync', (event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === 'check-pickup-alerts') {
    syncEvent.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify(): Promise<void> {
  try {
    // Dynamically import the checker to keep SW lean
    const { checkPickupAlerts } = await import('./domain/services/pickup-notification-checker');

    // Fetch active drugs — import Supabase store directly to avoid Automerge/WASM in SW context
    const { listAllPatientDrugs } = await import('./infra/supabase/prescription-drug-store');
    const drugs = await listAllPatientDrugs();
    const alerts = checkPickupAlerts(drugs);

    if (alerts.length === 0) return;

    // Show notifications for each alert
    for (const alert of alerts) {
      let body: string;
      if (alert.level === 'reminder') {
        body = `📋 En ${alert.daysUntilPickup} día(s): retiro de ${alert.drugName}`;
      } else if (alert.level === 'due') {
        body = `⚠️ Hoy: retiro de ${alert.drugName}`;
      } else {
        body = `🔴 Atrasado: retiro de ${alert.drugName}`;
      }

      await self.registration.showNotification('Retiro de Receta', {
        body,
        icon: '/pwa-192x192.svg',
        tag: `pickup-${alert.drugId}-${alert.level}`,
      });
    }
  } catch {
    // Silently fail — periodic sync is best-effort
  }
}

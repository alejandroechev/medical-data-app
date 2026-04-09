import { useState, useEffect, useCallback } from 'react';
import { listAllPatientDrugs } from '../../infra/store-provider';
import { getFamilyMembers } from '../../infra/supabase/family-member-store';
import { checkPickupAlerts } from '../../domain/services/pickup-notification-checker';
import { LocalStorageNotificationStateTracker } from '../../infra/notification-state';
import { showBrowserNotification, requestNotificationPermission } from '../../infra/browser-notifications';
import { schedulePickupNotifications } from '../../infra/notification-scheduler';
import { alertKey } from '../../domain/models/pickup-notification';
import type { PickupAlert } from '../../domain/models/pickup-notification';

const stateTracker = new LocalStorageNotificationStateTracker();

const LEVEL_MESSAGES: Record<PickupAlert['level'], (drug: string, patient: string | undefined, days: number) => string> = {
  reminder: (drug, patient, days) => `📋 En ${days} día${days !== 1 ? 's' : ''}: retiro de ${drug}${patient ? ` para ${patient}` : ''}`,
  due: (drug, patient) => `⚠️ Hoy: retiro de ${drug}${patient ? ` para ${patient}` : ''}`,
  overdue: (drug, patient) => `🔴 Atrasado: retiro de ${drug}${patient ? ` para ${patient}` : ''}`,
};

export function usePickupAlerts(today: Date = new Date()) {
  const [alerts, setAlerts] = useState<PickupAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const members = getFamilyMembers();
  const patientNames = new Map(members.map((m) => [m.id, m.name]));

  // Re-check when drugs change or page becomes visible
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setRefreshKey((k) => k + 1);
      }
    }
    function onDrugsChanged() {
      setRefreshKey((k) => k + 1);
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('medapp:drugs-changed', onDrugsChanged);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('medapp:drugs-changed', onDrugsChanged);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const drugs = await listAllPatientDrugs();
        if (cancelled) return;

        const found = checkPickupAlerts(drugs, today);
        setAlerts(found);

        // Schedule native notifications (Tauri) or no-op (web)
        schedulePickupNotifications(drugs, found);

        // Fire browser notifications for unseen alerts
        for (const alert of found) {
          const key = alertKey(alert);
          if (!stateTracker.hasSeen(key)) {
            stateTracker.markSeen(key);
            const patient = patientNames.get(alert.patientId);
            const msg = LEVEL_MESSAGES[alert.level](alert.drugName, patient, alert.daysUntilPickup);
            showBrowserNotification('Retiro de Receta', msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    requestNotificationPermission().then(() => load());

    return () => { cancelled = true; };
  }, [today.toDateString(), refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const dismissAlert = useCallback((key: string) => {
    stateTracker.dismiss(key);
    setDismissed((prev) => new Set(prev).add(key));
  }, []);

  const visibleAlerts = alerts.filter((a) => {
    const key = alertKey(a);
    return !dismissed.has(key) && !stateTracker.isDismissed(key);
  });

  return { alerts, visibleAlerts, loading, patientNames, dismissAlert, refresh };
}

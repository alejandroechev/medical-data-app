/**
 * Platform-aware notification scheduler for prescription pickup alerts.
 *
 * - Tauri (native Android): uses @tauri-apps/plugin-notification for scheduled OS notifications
 * - Browser (web/PWA): no-op — existing Browser Notification API in usePickupAlerts handles it
 *
 * Reuses the existing checkPickupAlerts() domain logic unchanged.
 */

import type { PatientDrug } from "../domain/models/prescription-drug.js";
import type { PickupAlert } from "../domain/models/pickup-notification.js";
import { getFamilyMemberById } from "./supabase/family-member-store.js";

const CHANNEL_ID = "retiro-recetas";

/** Detect if running inside Tauri */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** Schedule native notifications for all upcoming prescription pickups */
export async function schedulePickupNotifications(
  drugs: PatientDrug[],
  _alerts: PickupAlert[]
): Promise<void> {
  if (isTauri()) {
    await scheduleTauriNotifications(drugs);
  }
}

async function scheduleTauriNotifications(drugs: PatientDrug[]): Promise<void> {
  try {
    const {
      isPermissionGranted,
      requestPermission,
      sendNotification,
      createChannel,
      cancelAll,
      Schedule,
      Importance,
      Visibility,
    } = await import("@tauri-apps/plugin-notification");

    // Request permission if needed
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    if (!granted) return;

    // Create notification channel (Android)
    try {
      await createChannel({
        id: CHANNEL_ID,
        name: "Retiro de Recetas",
        description: "Recordatorios de retiro de medicamentos",
        importance: Importance.High,
        visibility: Visibility.Public,
        sound: "default",
        vibration: true,
      });
    } catch {
      // Channel may already exist
    }

    // Cancel all existing scheduled notifications and reschedule fresh
    await cancelAll();

    const now = new Date();
    let scheduled = 0;

    for (const drug of drugs) {
      if (drug.status !== "active" || !drug.nextPickupDate) continue;

      const pickupDate = new Date(drug.nextPickupDate + "T09:00:00");
      const patientName = getFamilyMemberById(drug.patientId)?.name;
      const nameLabel = patientName ? ` (${patientName})` : "";

      // Reminder: 3 days before at 9 AM
      const reminderDate = new Date(pickupDate);
      reminderDate.setDate(reminderDate.getDate() - 3);
      if (reminderDate > now) {
        await sendNotification({
          id: hashId(`reminder-${drug.id}`),
          channelId: CHANNEL_ID,
          title: "📋 Recordatorio de Retiro",
          body: `En 3 días: retiro de ${drug.name}${nameLabel}`,
          schedule: Schedule.at(reminderDate, false, true),
        });
        scheduled++;
      }

      // Due: day of at 9 AM
      if (pickupDate > now) {
        await sendNotification({
          id: hashId(`due-${drug.id}`),
          channelId: CHANNEL_ID,
          title: "⚠️ Retiro de Receta Hoy",
          body: `Hoy: retiro de ${drug.name}${nameLabel}`,
          schedule: Schedule.at(pickupDate, false, true),
        });
        scheduled++;
      }

      // Overdue: 1 day after at 9 AM
      const overdueDate = new Date(pickupDate);
      overdueDate.setDate(overdueDate.getDate() + 1);
      if (overdueDate > now) {
        await sendNotification({
          id: hashId(`overdue-${drug.id}`),
          channelId: CHANNEL_ID,
          title: "🔴 Retiro Atrasado",
          body: `Atrasado: retiro de ${drug.name}${nameLabel}`,
          schedule: Schedule.at(overdueDate, false, true),
        });
        scheduled++;
      }
    }

    console.log(`🔔 Scheduled ${scheduled} pickup notifications`);
  } catch (err) {
    console.warn("Failed to schedule native notifications:", err);
  }
}

/** Generate a stable numeric ID from a string (for notification dedup) */
function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

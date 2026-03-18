import type { PatientDrug } from '../models/prescription-drug.js';
import type { PickupAlert, AlertLevel } from '../models/pickup-notification.js';

/**
 * Pure function: given a list of patient drugs and today's date,
 * returns alerts for drugs with approaching/due/overdue pickup dates.
 *
 * Trigger rules:
 * - 1–3 days before nextPickupDate → 'reminder'
 * - On nextPickupDate → 'due'
 * - 1 day after nextPickupDate → 'overdue'
 */
export function checkPickupAlerts(
  drugs: PatientDrug[],
  today: Date = new Date()
): PickupAlert[] {
  const todayStr = toDateString(today);
  const alerts: PickupAlert[] = [];

  for (const drug of drugs) {
    if (drug.status !== 'active' || !drug.nextPickupDate) continue;

    const diff = daysDiff(todayStr, drug.nextPickupDate);

    let level: AlertLevel | null = null;
    if (diff >= 1 && diff <= 3) {
      level = 'reminder';
    } else if (diff === 0) {
      level = 'due';
    } else if (diff === -1) {
      level = 'overdue';
    }

    if (level) {
      alerts.push({
        drugId: drug.id,
        drugName: drug.name,
        patientId: drug.patientId,
        nextPickupDate: drug.nextPickupDate,
        level,
        daysUntilPickup: diff,
      });
    }
  }

  return alerts;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Days from today to target. Positive = future, negative = past. */
function daysDiff(todayStr: string, targetStr: string): number {
  const msPerDay = 86_400_000;
  const today = new Date(todayStr + 'T00:00:00');
  const target = new Date(targetStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

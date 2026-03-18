export type AlertLevel = 'reminder' | 'due' | 'overdue';

export interface PickupAlert {
  drugId: string;
  drugName: string;
  patientId: string;
  nextPickupDate: string;
  level: AlertLevel;
  daysUntilPickup: number;
}

export function alertKey(alert: PickupAlert): string {
  return `${alert.drugId}:${alert.nextPickupDate}:${alert.level}`;
}

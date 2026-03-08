export interface PrescriptionDrug {
  id: string;
  eventId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  createdAt: string;
}

export interface CreatePrescriptionDrugInput {
  eventId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
}

// --- First-class Patient Drug model ---

export type DrugSchedule =
  | { type: 'interval'; intervalHours: number }
  | { type: 'fixed'; times: string[] }; // HH:mm format

export type DrugDuration =
  | { type: 'days'; days: number }
  | { type: 'indefinite' };

export type DrugStatus = 'active' | 'completed' | 'stopped';

export const DRUG_STATUSES: DrugStatus[] = ['active', 'completed', 'stopped'];

export interface PatientDrug {
  id: string;
  patientId: string;
  eventId?: string;
  name: string;
  dosage: string;
  schedule: DrugSchedule;
  duration: DrugDuration;
  startDate: string;
  startTime?: string; // HH:mm — time of first dose
  endDate?: string;
  isPermanent: boolean;
  nextPickupDate?: string;
  status: DrugStatus;
  createdAt: string;
}

export interface CreatePatientDrugInput {
  patientId: string;
  eventId?: string;
  name: string;
  dosage: string;
  schedule: DrugSchedule;
  duration: DrugDuration;
  startDate: string;
  startTime?: string;
  isPermanent?: boolean;
  nextPickupDate?: string;
}

export interface UpdatePatientDrugInput {
  name?: string;
  dosage?: string;
  schedule?: DrugSchedule;
  duration?: DrugDuration;
  startDate?: string;
  startTime?: string | null;
  endDate?: string | null;
  isPermanent?: boolean;
  nextPickupDate?: string | null;
  status?: DrugStatus;
}

export function formatSchedule(schedule: DrugSchedule): string {
  if (schedule.type === 'interval') {
    return `cada ${schedule.intervalHours}h`;
  }
  return schedule.times.join(', ');
}

export function formatDuration(duration: DrugDuration): string {
  if (duration.type === 'days') {
    return `${duration.days} días`;
  }
  return 'permanente';
}

/**
 * Calculate treatment progress accounting for start time.
 * If schedule is fixed-times and startTime is late in the day, not all doses
 * happen on day 1. The remaining doses spill into an extra calendar day.
 * Returns total calendar days the treatment actually spans, and current day.
 */
export function getTreatmentProgress(
  drug: PatientDrug
): { currentDay: number; totalDays: number; dosesRemaining: number } | null {
  if (drug.duration.type !== 'days') return null;

  const startDateTime = new Date(
    drug.startDate + 'T' + (drug.startTime ?? '00:00') + ':00'
  );
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  // Doses per day
  let dosesPerDay: number;
  if (drug.schedule.type === 'fixed') {
    dosesPerDay = drug.schedule.times.length;
  } else {
    dosesPerDay = Math.max(1, Math.floor(24 / drug.schedule.intervalHours));
  }

  // On day 1, how many doses fit from startTime to end of day?
  let firstDayDoses = dosesPerDay;
  if (drug.schedule.type === 'fixed' && drug.startTime) {
    firstDayDoses = drug.schedule.times.filter((t) => t >= drug.startTime!).length;
  } else if (drug.schedule.type === 'interval' && drug.startTime) {
    const startHour = parseInt(drug.startTime.split(':')[0]);
    const hoursLeft = 24 - startHour;
    firstDayDoses = Math.max(1, Math.ceil(hoursLeft / drug.schedule.intervalHours));
  }

  // Total doses needed
  const totalDoses = drug.duration.days * dosesPerDay;
  // Doses missed on day 1
  const missedDay1 = dosesPerDay - firstDayDoses;
  // Extra calendar days needed for missed doses
  const extraDays = missedDay1 > 0 ? Math.ceil(missedDay1 / dosesPerDay) : 0;
  const totalCalendarDays = drug.duration.days + extraDays;

  const elapsedMs = now.getTime() - startDateTime.getTime();
  const elapsedDays = Math.floor(elapsedMs / msPerDay) + 1;
  const currentDay = Math.max(1, Math.min(elapsedDays, totalCalendarDays));

  const dosesCompleted = Math.min(
    totalDoses,
    firstDayDoses + Math.max(0, currentDay - 1) * dosesPerDay
  );
  const dosesRemaining = Math.max(0, totalDoses - dosesCompleted);

  return { currentDay, totalDays: totalCalendarDays, dosesRemaining };
}

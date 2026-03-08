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
  isPermanent?: boolean;
  nextPickupDate?: string;
}

export interface UpdatePatientDrugInput {
  name?: string;
  dosage?: string;
  schedule?: DrugSchedule;
  duration?: DrugDuration;
  startDate?: string;
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

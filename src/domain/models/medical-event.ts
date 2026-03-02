export const EVENT_TYPES = [
  'Consulta Médica',
  'Consulta Dental',
  'Urgencia',
  'Cirugía',
  'Examen',
  'Otro',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface MedicalEvent {
  id: string;
  date: string;
  type: EventType;
  description: string;
  patientId: string;
  professionalId?: string;
  locationId?: string;
  isapreReimbursed: boolean;
  insuranceReimbursed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalEventInput {
  date: string;
  type: EventType;
  description: string;
  patientId: string;
  professionalId?: string;
  locationId?: string;
  isapreReimbursed?: boolean;
  insuranceReimbursed?: boolean;
}

export interface UpdateMedicalEventInput {
  date?: string;
  type?: EventType;
  description?: string;
  patientId?: string;
  professionalId?: string | null;
  locationId?: string | null;
  isapreReimbursed?: boolean;
  insuranceReimbursed?: boolean;
}

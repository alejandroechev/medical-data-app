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
  date: string; // ISO date string YYYY-MM-DD
  type: EventType;
  description: string;
  patientId: string;
  isapreReimbursed: boolean;
  insuranceReimbursed: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CreateMedicalEventInput {
  date: string;
  type: EventType;
  description: string;
  patientId: string;
  isapreReimbursed?: boolean;
  insuranceReimbursed?: boolean;
}

export interface UpdateMedicalEventInput {
  date?: string;
  type?: EventType;
  description?: string;
  patientId?: string;
  isapreReimbursed?: boolean;
  insuranceReimbursed?: boolean;
}

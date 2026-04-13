export const EVENT_TYPES = [
  'Consulta Médica',
  'Consulta Dental',
  'Urgencia',
  'Cirugía',
  'Examen',
  'Receta',
  'Otro',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const REIMBURSEMENT_STATUSES = ['none', 'requested', 'approved', 'rejected'] as const;
export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

export const REEMBOLSO_LINKS = {
  isapre: 'https://sucursalvirtual.somosesencial.cl/',
  insurance: 'https://clientes.segurossura.cl/',
} as const;

export interface MedicalEvent {
  id: string;
  date: string;
  type: EventType;
  description: string;
  patientId: string;
  professionalId?: string;
  locationId?: string;
  parentEventId?: string;
  cost?: number;
  isapreReimbursementStatus: ReimbursementStatus;
  insuranceReimbursementStatus: ReimbursementStatus;
  isArchived?: boolean;
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
  parentEventId?: string;
  cost?: number;
  isapreReimbursementStatus?: ReimbursementStatus;
  insuranceReimbursementStatus?: ReimbursementStatus;
}

export interface UpdateMedicalEventInput {
  date?: string;
  type?: EventType;
  description?: string;
  patientId?: string;
  professionalId?: string | null;
  locationId?: string | null;
  parentEventId?: string | null;
  cost?: number | null;
  isapreReimbursementStatus?: ReimbursementStatus;
  insuranceReimbursementStatus?: ReimbursementStatus;
  isArchived?: boolean;
}

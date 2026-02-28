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
  fecha: string; // ISO date string YYYY-MM-DD
  tipo: EventType;
  descripcion: string;
  pacienteId: string;
  reembolsoIsapre: boolean;
  reembolsoSeguro: boolean;
  creadoEn: string; // ISO timestamp
  actualizadoEn: string; // ISO timestamp
}

export interface CreateMedicalEventInput {
  fecha: string;
  tipo: EventType;
  descripcion: string;
  pacienteId: string;
  reembolsoIsapre?: boolean;
  reembolsoSeguro?: boolean;
}

export interface UpdateMedicalEventInput {
  fecha?: string;
  tipo?: EventType;
  descripcion?: string;
  pacienteId?: string;
  reembolsoIsapre?: boolean;
  reembolsoSeguro?: boolean;
}

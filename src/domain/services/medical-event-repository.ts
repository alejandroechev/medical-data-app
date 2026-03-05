import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput, ReimbursementStatus } from '../models/medical-event.js';

export interface MedicalEventFilters {
  patientId?: string;
  type?: string;
  from?: string;
  to?: string;
  isapreReimbursementStatus?: ReimbursementStatus;
  insuranceReimbursementStatus?: ReimbursementStatus;
  professionalId?: string;
  locationId?: string;
}

export interface MedicalEventRepository {
  create(input: CreateMedicalEventInput): Promise<MedicalEvent>;
  getById(id: string): Promise<MedicalEvent | null>;
  list(filters?: MedicalEventFilters): Promise<MedicalEvent[]>;
  update(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent>;
  remove(id: string): Promise<void>;
}

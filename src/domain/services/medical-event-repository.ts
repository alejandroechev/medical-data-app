import { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../models/medical-event.js';

export interface MedicalEventFilters {
  pacienteId?: string;
  tipo?: string;
  desde?: string; // ISO date
  hasta?: string; // ISO date
}

export interface MedicalEventRepository {
  crear(input: CreateMedicalEventInput): Promise<MedicalEvent>;
  obtenerPorId(id: string): Promise<MedicalEvent | null>;
  listar(filtros?: MedicalEventFilters): Promise<MedicalEvent[]>;
  actualizar(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent>;
  eliminar(id: string): Promise<void>;
}

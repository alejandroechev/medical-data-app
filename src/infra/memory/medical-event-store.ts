import { v4 as uuidv4 } from 'uuid';
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from '../../domain/models/medical-event.js';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository.js';

export class InMemoryMedicalEventStore {
  private events: Map<string, MedicalEvent> = new Map();

  async create(input: CreateMedicalEventInput): Promise<MedicalEvent> {
    const now = new Date().toISOString();
    const event: MedicalEvent = {
      id: uuidv4(),
      date: input.date,
      type: input.type,
      description: input.description,
      patientId: input.patientId,
      professionalId: input.professionalId,
      locationId: input.locationId,
      parentEventId: input.parentEventId,
      isapreReimbursementStatus: input.isapreReimbursementStatus ?? 'none',
      insuranceReimbursementStatus: input.insuranceReimbursementStatus ?? 'none',
      isArchived: input.isArchived ?? false,
      cost: input.cost,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(event.id, event);
    return { ...event };
  }

  async getById(id: string): Promise<MedicalEvent | null> {
    const event = this.events.get(id);
    return event ? { ...event } : null;
  }

  async list(filters?: MedicalEventFilters): Promise<MedicalEvent[]> {
    let results = Array.from(this.events.values());

    if (!filters?.includeArchived) {
      results = results.filter((e) => e.isArchived !== true);
    }

    if (filters?.patientId) {
      results = results.filter((e) => e.patientId === filters.patientId);
    }
    if (filters?.type) {
      results = results.filter((e) => e.type === filters.type);
    }
    if (filters?.from) {
      results = results.filter((e) => e.date >= filters.from!);
    }
    if (filters?.to) {
      results = results.filter((e) => e.date <= filters.to!);
    }
    if (filters?.isapreReimbursementStatus !== undefined) {
      results = results.filter((e) => e.isapreReimbursementStatus === filters.isapreReimbursementStatus);
    }
    if (filters?.insuranceReimbursementStatus !== undefined) {
      results = results.filter((e) => e.insuranceReimbursementStatus === filters.insuranceReimbursementStatus);
    }
    if (filters?.professionalId) {
      results = results.filter((e) => e.professionalId === filters.professionalId);
    }
    if (filters?.locationId) {
      results = results.filter((e) => e.locationId === filters.locationId);
    }

    return results.sort((a, b) => b.date.localeCompare(a.date)).map((e) => ({ ...e }));
  }

  async update(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
    const existing = this.events.get(id);
    if (!existing) throw new Error(`Evento ${id} no encontrado`);

    const updated: MedicalEvent = {
      ...existing,
      ...(input.date !== undefined && { date: input.date }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.patientId !== undefined && { patientId: input.patientId }),
      ...(input.professionalId !== undefined && { professionalId: input.professionalId ?? undefined }),
      ...(input.locationId !== undefined && { locationId: input.locationId ?? undefined }),
      ...(input.parentEventId !== undefined && { parentEventId: input.parentEventId ?? undefined }),
      ...(input.isapreReimbursementStatus !== undefined && { isapreReimbursementStatus: input.isapreReimbursementStatus }),
      ...(input.insuranceReimbursementStatus !== undefined && { insuranceReimbursementStatus: input.insuranceReimbursementStatus }),
      ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      ...(input.cost !== undefined && { cost: input.cost ?? undefined }),
      updatedAt: new Date().toISOString(),
    };
    this.events.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }
}

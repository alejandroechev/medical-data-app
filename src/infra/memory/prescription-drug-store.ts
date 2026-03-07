import { v4 as uuidv4 } from 'uuid';
import type { PrescriptionDrug, CreatePrescriptionDrugInput } from '../../domain/models/prescription-drug.js';

export class InMemoryPrescriptionDrugStore {
  private drugs: Map<string, PrescriptionDrug> = new Map();

  async create(input: CreatePrescriptionDrugInput): Promise<PrescriptionDrug> {
    const drug: PrescriptionDrug = {
      id: uuidv4(),
      eventId: input.eventId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      durationDays: input.durationDays,
      createdAt: new Date().toISOString(),
    };
    this.drugs.set(drug.id, drug);
    return { ...drug };
  }

  async listByEvent(eventId: string): Promise<PrescriptionDrug[]> {
    return Array.from(this.drugs.values())
      .filter((d) => d.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((d) => ({ ...d }));
  }

  async delete(id: string): Promise<void> {
    this.drugs.delete(id);
  }
}

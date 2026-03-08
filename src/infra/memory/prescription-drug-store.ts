import { v4 as uuidv4 } from 'uuid';
import type { PrescriptionDrug, CreatePrescriptionDrugInput, PatientDrug, CreatePatientDrugInput, UpdatePatientDrugInput } from '../../domain/models/prescription-drug.js';

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

  async listAll(): Promise<PrescriptionDrug[]> {
    return Array.from(this.drugs.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({ ...d }));
  }

  async delete(id: string): Promise<void> {
    this.drugs.delete(id);
  }
}

export class InMemoryPatientDrugStore {
  private drugs: Map<string, PatientDrug> = new Map();

  async create(input: CreatePatientDrugInput): Promise<PatientDrug> {
    const drug: PatientDrug = {
      id: uuidv4(),
      patientId: input.patientId,
      eventId: input.eventId,
      name: input.name,
      dosage: input.dosage,
      schedule: input.schedule,
      duration: input.duration,
      startDate: input.startDate,
      isPermanent: input.isPermanent ?? false,
      nextPickupDate: input.nextPickupDate,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.drugs.set(drug.id, drug);
    return { ...drug };
  }

  async update(id: string, input: UpdatePatientDrugInput): Promise<PatientDrug> {
    const existing = this.drugs.get(id);
    if (!existing) throw new Error(`Medicamento ${id} no encontrado`);

    const updated: PatientDrug = {
      ...existing,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.dosage !== undefined && { dosage: input.dosage }),
      ...(input.schedule !== undefined && { schedule: input.schedule }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate ?? undefined }),
      ...(input.isPermanent !== undefined && { isPermanent: input.isPermanent }),
      ...(input.nextPickupDate !== undefined && { nextPickupDate: input.nextPickupDate ?? undefined }),
      ...(input.status !== undefined && { status: input.status }),
    };
    this.drugs.set(id, updated);
    return { ...updated };
  }

  async getById(id: string): Promise<PatientDrug | null> {
    const drug = this.drugs.get(id);
    return drug ? { ...drug } : null;
  }

  async listByPatient(patientId: string): Promise<PatientDrug[]> {
    return Array.from(this.drugs.values())
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((d) => ({ ...d }));
  }

  async listByEvent(eventId: string): Promise<PatientDrug[]> {
    return Array.from(this.drugs.values())
      .filter((d) => d.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((d) => ({ ...d }));
  }

  async listActive(patientId?: string): Promise<PatientDrug[]> {
    let results = Array.from(this.drugs.values()).filter((d) => d.status === 'active');
    if (patientId) results = results.filter((d) => d.patientId === patientId);
    return results.sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ ...d }));
  }

  async listAll(): Promise<PatientDrug[]> {
    return Array.from(this.drugs.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({ ...d }));
  }

  async delete(id: string): Promise<void> {
    this.drugs.delete(id);
  }
}

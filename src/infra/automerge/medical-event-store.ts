import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from "../../domain/models/medical-event.js";
import type { MedicalEventFilters } from "../../domain/services/medical-event-repository.js";

export async function createEvent(input: CreateMedicalEventInput): Promise<MedicalEvent> {
  const handle = await getDocHandle();
  const now = new Date().toISOString();
  const id = uuidv4();

  const event: MedicalEvent = {
    id,
    date: input.date,
    type: input.type,
    description: input.description,
    patientId: input.patientId,
    professionalId: input.professionalId,
    locationId: input.locationId,
    parentEventId: input.parentEventId,
    cost: input.cost,
    isapreReimbursementStatus: input.isapreReimbursementStatus ?? "none",
    insuranceReimbursementStatus: input.insuranceReimbursementStatus ?? "none",
    createdAt: now,
    updatedAt: now,
  };

  handle.change((d) => {
    if (!d.medicalEvents) d.medicalEvents = {};
    d.medicalEvents[id] = event;
  });

  return { ...event };
}

export async function getEventById(id: string): Promise<MedicalEvent | null> {
  const doc = await waitForDoc();
  const event = doc.medicalEvents?.[id];
  return event ? { ...event } : null;
}

export async function listEvents(filters?: MedicalEventFilters): Promise<MedicalEvent[]> {
  const doc = await waitForDoc();
  let results = Object.values(doc.medicalEvents || {});

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

export async function updateEvent(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
  const handle = await getDocHandle();
  const doc = await waitForDoc();
  const existing = doc.medicalEvents?.[id];
  if (!existing) throw new Error(`Evento ${id} no encontrado`);

  handle.change((d) => {
    const e = d.medicalEvents[id];
    if (input.date !== undefined) e.date = input.date;
    if (input.type !== undefined) e.type = input.type;
    if (input.description !== undefined) e.description = input.description;
    if (input.patientId !== undefined) e.patientId = input.patientId;
    if (input.professionalId !== undefined) e.professionalId = input.professionalId ?? undefined;
    if (input.locationId !== undefined) e.locationId = input.locationId ?? undefined;
    if (input.parentEventId !== undefined) e.parentEventId = input.parentEventId ?? undefined;
    if (input.cost !== undefined) e.cost = input.cost ?? undefined;
    if (input.isapreReimbursementStatus !== undefined) e.isapreReimbursementStatus = input.isapreReimbursementStatus;
    if (input.insuranceReimbursementStatus !== undefined) e.insuranceReimbursementStatus = input.insuranceReimbursementStatus;
    e.updatedAt = new Date().toISOString();
  });

  const updated = (await waitForDoc()).medicalEvents[id];
  return { ...updated };
}

export async function deleteEvent(id: string): Promise<void> {
  const handle = await getDocHandle();
  handle.change((d) => {
    delete d.medicalEvents[id];
  });
}

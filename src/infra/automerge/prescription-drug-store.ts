import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type {
  PrescriptionDrug,
  CreatePrescriptionDrugInput,
  PatientDrug,
  CreatePatientDrugInput,
  UpdatePatientDrugInput,
} from "../../domain/models/prescription-drug.js";

// --- Prescription Drugs ---

export async function createPrescriptionDrug(input: CreatePrescriptionDrugInput): Promise<PrescriptionDrug> {
  const handle = await getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const drug: PrescriptionDrug = {
    id,
    eventId: input.eventId,
    name: input.name,
    dosage: input.dosage,
    frequency: input.frequency,
    durationDays: input.durationDays,
    createdAt: now,
  };

  handle.change((d) => {
    if (!d.prescriptionDrugs) d.prescriptionDrugs = {};
    d.prescriptionDrugs[id] = drug;
  });

  return { ...drug };
}

export async function listPrescriptionDrugsByEvent(eventId: string): Promise<PrescriptionDrug[]> {
  const doc = await waitForDoc();
  return Object.values(doc.prescriptionDrugs || {})
    .filter((d) => d.eventId === eventId)
    .map((d) => ({ ...d }));
}

export async function listAllPrescriptionDrugs(): Promise<PrescriptionDrug[]> {
  const doc = await waitForDoc();
  return Object.values(doc.prescriptionDrugs || {}).map((d) => ({ ...d }));
}

export async function deletePrescriptionDrug(id: string): Promise<void> {
  const handle = await getDocHandle();
  handle.change((d) => {
    delete d.prescriptionDrugs[id];
  });
}

// --- Patient Drugs (first-class treatments) ---

export async function createPatientDrug(input: CreatePatientDrugInput): Promise<PatientDrug> {
  const handle = await getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const drug: PatientDrug = {
    id,
    patientId: input.patientId,
    eventId: input.eventId,
    name: input.name,
    dosage: input.dosage,
    schedule: input.schedule,
    duration: input.duration,
    startDate: input.startDate,
    startTime: input.startTime,
    isPermanent: input.isPermanent ?? false,
    nextPickupDate: input.nextPickupDate,
    status: "active",
    createdAt: now,
  };

  handle.change((d) => {
    if (!d.patientDrugs) d.patientDrugs = {};
    d.patientDrugs[id] = drug;
  });

  return { ...drug };
}

export async function updatePatientDrug(id: string, input: UpdatePatientDrugInput): Promise<PatientDrug> {
  const handle = await getDocHandle();
  const doc = await waitForDoc();
  const existing = doc.patientDrugs?.[id];
  if (!existing) throw new Error(`Tratamiento ${id} no encontrado`);

  handle.change((d) => {
    const drug = d.patientDrugs[id];
    if (input.name !== undefined) drug.name = input.name;
    if (input.dosage !== undefined) drug.dosage = input.dosage;
    if (input.schedule !== undefined) drug.schedule = input.schedule;
    if (input.duration !== undefined) drug.duration = input.duration;
    if (input.startDate !== undefined) drug.startDate = input.startDate;
    if (input.startTime !== undefined) drug.startTime = input.startTime ?? undefined;
    if (input.endDate !== undefined) drug.endDate = input.endDate ?? undefined;
    if (input.isPermanent !== undefined) drug.isPermanent = input.isPermanent;
    if (input.nextPickupDate !== undefined) drug.nextPickupDate = input.nextPickupDate ?? undefined;
    if (input.status !== undefined) drug.status = input.status;
  });

  const updated = (await waitForDoc()).patientDrugs[id];
  return { ...updated };
}

export async function listPatientDrugsByPatient(patientId: string): Promise<PatientDrug[]> {
  const doc = await waitForDoc();
  return Object.values(doc.patientDrugs || {})
    .filter((d) => d.patientId === patientId)
    .map((d) => ({ ...d }));
}

export async function listPatientDrugsByEvent(eventId: string): Promise<PatientDrug[]> {
  const doc = await waitForDoc();
  return Object.values(doc.patientDrugs || {})
    .filter((d) => d.eventId === eventId)
    .map((d) => ({ ...d }));
}

export async function listActivePatientDrugs(patientId?: string): Promise<PatientDrug[]> {
  const doc = await waitForDoc();
  let results = Object.values(doc.patientDrugs || {}).filter((d) => d.status === "active");
  if (patientId) {
    results = results.filter((d) => d.patientId === patientId);
  }
  return results.map((d) => ({ ...d }));
}

export async function listAllPatientDrugs(): Promise<PatientDrug[]> {
  const doc = await waitForDoc();
  return Object.values(doc.patientDrugs || {}).map((d) => ({ ...d }));
}

export async function deletePatientDrug(id: string): Promise<void> {
  const handle = await getDocHandle();
  handle.change((d) => {
    delete d.patientDrugs[id];
  });
}

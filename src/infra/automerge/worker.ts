/**
 * Automerge Web Worker — owns the CRDT Repo, IDB storage, and WebSocket sync.
 * All Automerge WASM processing happens here, off the main thread.
 *
 * Handles ALL store operations: events, photos, recordings, professionals,
 * locations, prescription drugs, and patient drugs.
 *
 * Communication protocol:
 *   Main → Worker: { id: number, method: string, args: any[] }
 *   Worker → Main: { id: number, result?: any, error?: string }
 *   Worker → Main: { type: "change" }   (doc changed notification)
 *   Main → Worker: { type: "init", config: WorkerConfig }
 */

self.onerror = (event) => {
  self.postMessage({ type: "init-error", error: `Worker error: ${event}` });
};
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  self.postMessage({ type: "init-error", error: `Unhandled rejection: ${event.reason}` });
};

import { Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import type { AutomergeUrl, DocHandle, NetworkAdapterInterface } from "@automerge/automerge-repo";
import type { MedAppDoc } from "./schema.js";
import { CURRENT_SCHEMA_VERSION } from "./schema.js";
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from "../../domain/models/medical-event.js";
import type { EventPhoto, LinkPhotoInput } from "../../domain/models/event-photo.js";
import type { EventRecording, CreateRecordingInput } from "../../domain/models/event-recording.js";
import type {
  PrescriptionDrug,
  CreatePrescriptionDrugInput,
  PatientDrug,
  CreatePatientDrugInput,
  UpdatePatientDrugInput,
} from "../../domain/models/prescription-drug.js";
import type { Professional, Location } from "../../domain/models/professional-location.js";
import type { MedicalEventFilters } from "../../domain/services/medical-event-repository.js";
import { v4 as uuidv4 } from "uuid";

const IDB_NAME = "medapp-automerge";
const DOC_READY_TIMEOUT_MS = 10_000;

let repo: Repo | null = null;
let handle: DocHandle<MedAppDoc> | null = null;
let initDone = false;
let pendingMessages: MessageEvent[] = [];

function toPlain<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Strip properties whose value is `undefined`. Automerge does not allow
 * assigning `undefined` — fields must be omitted (or set to `null`) instead.
 */
function stripUndefined<T>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const k in obj as Record<string, unknown>) {
    if ((obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out as T;
}

interface WorkerConfig {
  wsUrl: string;
  docUrl: string;
}

function createInitialDoc(): MedAppDoc {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    medicalEvents: {},
    eventPhotos: {},
    eventRecordings: {},
    professionals: {},
    locations: {},
    prescriptionDrugs: {},
    patientDrugs: {},
  };
}

async function init(config: WorkerConfig): Promise<void> {
  const idbAdapter = new IndexedDBStorageAdapter(IDB_NAME);
  repo = new Repo({ storage: idbAdapter });

  if (config.docUrl) {
    handle = await repo.find<MedAppDoc>(config.docUrl as AutomergeUrl);

    if (!handle.doc()) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, DOC_READY_TIMEOUT_MS);
        handle!.whenReady().then(() => { clearTimeout(timer); resolve(); })
          .catch(() => { clearTimeout(timer); resolve(); });
      });
    }

    // Run schema migrations inline (mirrors migrations.ts)
    const doc = handle.doc();
    if (doc) {
      const currentVersion = doc.schemaVersion ?? 0;
      if (currentVersion < CURRENT_SCHEMA_VERSION) {
        handle.change((d) => {
          // Migration 0 → 1: ensure all collection maps exist
          if (!d.medicalEvents) d.medicalEvents = {};
          if (!d.eventPhotos) d.eventPhotos = {};
          if (!d.eventRecordings) d.eventRecordings = {};
          if (!d.professionals) d.professionals = {};
          if (!d.locations) d.locations = {};
          if (!d.prescriptionDrugs) d.prescriptionDrugs = {};
          if (!d.patientDrugs) d.patientDrugs = {};
          // Migration 1 → 2: no-op (isArchived defaults to undefined)
          d.schemaVersion = CURRENT_SCHEMA_VERSION;
        });
      }
    }
  } else {
    handle = repo.create<MedAppDoc>(createInitialDoc());
  }

  handle!.on("change", () => {
    self.postMessage({ type: "change" });
  });

  self.postMessage({ type: "init-done", docUrl: handle!.url });

  initDone = true;
  for (const queued of pendingMessages) {
    handleRpc(queued.data);
  }
  pendingMessages = [];

  self.postMessage({ type: "change" });

  // Add WebSocket AFTER doc is loaded so sync doesn't block startup
  if (config.wsUrl) {
    setTimeout(() => {
      if (!repo) return;
      try {
        const wsAdapter = new BrowserWebSocketClientAdapter(config.wsUrl);
        repo.networkSubsystem.addNetworkAdapter(wsAdapter as NetworkAdapterInterface);
      } catch (err) {
        console.error("WebSocket failed:", (err as Error).message);
      }
    }, 2000);
  }
}

function getDoc(): MedAppDoc | undefined {
  return handle?.doc();
}

// ============= RPC Handlers =============

const handlers: Record<string, (...args: any[]) => any> = {

  // --- Medical Events ---

  createEvent(input: CreateMedicalEventInput): MedicalEvent {
    const now = new Date().toISOString();
    const id = uuidv4();
    const event: MedicalEvent = stripUndefined({
      id,
      date: input.date,
      type: input.type,
      description: input.description,
      patientId: input.patientId,
      professionalId: input.professionalId ?? undefined,
      locationId: input.locationId ?? undefined,
      parentEventId: input.parentEventId ?? undefined,
      cost: input.cost ?? undefined,
      isapreReimbursementStatus: input.isapreReimbursementStatus ?? "none",
      insuranceReimbursementStatus: input.insuranceReimbursementStatus ?? "none",
      createdAt: now,
      updatedAt: now,
    });
    handle!.change((d) => {
      if (!d.medicalEvents) d.medicalEvents = {};
      d.medicalEvents[id] = event;
    });
    return toPlain(handle!.doc()!.medicalEvents[id]);
  },

  getEventById(id: string): MedicalEvent | null {
    const doc = getDoc();
    const event = doc?.medicalEvents?.[id];
    return event ? toPlain(event) : null;
  },

  listEvents(filters?: MedicalEventFilters): MedicalEvent[] {
    const doc = getDoc();
    if (!doc) return [];
    let results = Object.values(doc.medicalEvents || {});

    if (filters?.includeArchived !== true) {
      results = results.filter((e) => e.isArchived !== true);
    }
    if (filters?.patientId) results = results.filter((e) => e.patientId === filters.patientId);
    if (filters?.type) results = results.filter((e) => e.type === filters.type);
    if (filters?.from) results = results.filter((e) => e.date >= filters.from!);
    if (filters?.to) results = results.filter((e) => e.date <= filters.to!);
    if (filters?.isapreReimbursementStatus !== undefined) {
      results = results.filter((e) => e.isapreReimbursementStatus === filters.isapreReimbursementStatus);
    }
    if (filters?.insuranceReimbursementStatus !== undefined) {
      results = results.filter((e) => e.insuranceReimbursementStatus === filters.insuranceReimbursementStatus);
    }
    if (filters?.professionalId) results = results.filter((e) => e.professionalId === filters.professionalId);
    if (filters?.locationId) results = results.filter((e) => e.locationId === filters.locationId);

    return results.sort((a, b) => b.date.localeCompare(a.date)).map((e) => toPlain(e));
  },

  updateEvent(id: string, input: UpdateMedicalEventInput): MedicalEvent {
    const doc = getDoc();
    if (!doc?.medicalEvents?.[id]) throw new Error(`Evento ${id} no encontrado`);
    handle!.change((d) => {
      const e = d.medicalEvents[id];
      if (input.date !== undefined) e.date = input.date;
      if (input.type !== undefined) e.type = input.type;
      if (input.description !== undefined) e.description = input.description;
      if (input.patientId !== undefined) e.patientId = input.patientId;
      if (input.professionalId !== undefined) {
        if (input.professionalId) e.professionalId = input.professionalId;
        else delete e.professionalId;
      }
      if (input.locationId !== undefined) {
        if (input.locationId) e.locationId = input.locationId;
        else delete e.locationId;
      }
      if (input.parentEventId !== undefined) {
        if (input.parentEventId) e.parentEventId = input.parentEventId;
        else delete e.parentEventId;
      }
      if (input.cost !== undefined) {
        if (input.cost !== null) e.cost = input.cost;
        else delete e.cost;
      }
      if (input.isapreReimbursementStatus !== undefined) e.isapreReimbursementStatus = input.isapreReimbursementStatus;
      if (input.insuranceReimbursementStatus !== undefined) e.insuranceReimbursementStatus = input.insuranceReimbursementStatus;
      if (input.isArchived !== undefined) e.isArchived = input.isArchived;
      e.updatedAt = new Date().toISOString();
    });
    return toPlain(handle!.doc()!.medicalEvents[id]);
  },

  archiveEvent(id: string): void {
    const doc = getDoc();
    if (!doc?.medicalEvents?.[id]) throw new Error(`Evento ${id} no encontrado`);
    handle!.change((d) => {
      d.medicalEvents[id].isArchived = true;
      d.medicalEvents[id].updatedAt = new Date().toISOString();
    });
  },

  unarchiveEvent(id: string): void {
    const doc = getDoc();
    if (!doc?.medicalEvents?.[id]) throw new Error(`Evento ${id} no encontrado`);
    handle!.change((d) => {
      d.medicalEvents[id].isArchived = false;
      d.medicalEvents[id].updatedAt = new Date().toISOString();
    });
  },

  deleteEvent(id: string): void {
    handle!.change((d) => {
      delete d.medicalEvents[id];
    });
  },

  // --- Event Photos (CRDT only — blob ops stay on main thread) ---

  linkPhoto(input: LinkPhotoInput): EventPhoto {
    const id = uuidv4();
    const now = new Date().toISOString();
    const photo: EventPhoto = stripUndefined({
      id,
      eventId: input.eventId,
      googlePhotosUrl: input.googlePhotosUrl,
      googlePhotosId: input.googlePhotosId,
      description: input.description,
      createdAt: now,
    });
    handle!.change((d) => {
      if (!d.eventPhotos) d.eventPhotos = {};
      d.eventPhotos[id] = photo;
    });
    return toPlain(handle!.doc()!.eventPhotos[id]);
  },

  listPhotosByEvent(eventId: string): EventPhoto[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.eventPhotos || {})
      .filter((p) => p.eventId === eventId)
      .map((p) => toPlain(p));
  },

  unlinkPhoto(id: string): void {
    handle!.change((d) => {
      delete d.eventPhotos[id];
    });
  },

  // --- Recordings ---

  createRecording(input: CreateRecordingInput): EventRecording {
    const id = uuidv4();
    const now = new Date().toISOString();
    const recording: EventRecording = stripUndefined({
      id,
      eventId: input.eventId,
      recordingUrl: input.recordingUrl,
      fileName: input.fileName,
      durationSeconds: input.durationSeconds,
      description: input.description,
      createdAt: now,
    });
    handle!.change((d) => {
      if (!d.eventRecordings) d.eventRecordings = {};
      d.eventRecordings[id] = recording;
    });
    return toPlain(handle!.doc()!.eventRecordings[id]);
  },

  listRecordingsByEvent(eventId: string): EventRecording[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.eventRecordings || {})
      .filter((r) => r.eventId === eventId)
      .map((r) => toPlain(r));
  },

  deleteRecording(id: string): void {
    handle!.change((d) => {
      delete d.eventRecordings[id];
    });
  },

  // --- Professionals ---

  createProfessional(name: string, specialty?: string): Professional {
    const id = uuidv4();
    const now = new Date().toISOString();
    const professional: Professional = stripUndefined({ id, name, specialty, createdAt: now });
    handle!.change((d) => {
      if (!d.professionals) d.professionals = {};
      d.professionals[id] = professional;
    });
    return toPlain(handle!.doc()!.professionals[id]);
  },

  listProfessionals(): Professional[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.professionals || {}).map((p) => toPlain(p));
  },

  getProfessionalById(id: string): Professional | undefined {
    const doc = getDoc();
    const p = doc?.professionals?.[id];
    return p ? toPlain(p) : undefined;
  },

  // --- Locations ---

  createLocation(name: string): Location {
    const id = uuidv4();
    const now = new Date().toISOString();
    const location: Location = { id, name, createdAt: now };
    handle!.change((d) => {
      if (!d.locations) d.locations = {};
      d.locations[id] = location;
    });
    return toPlain(handle!.doc()!.locations[id]);
  },

  listLocations(): Location[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.locations || {}).map((l) => toPlain(l));
  },

  getLocationById(id: string): Location | undefined {
    const doc = getDoc();
    const l = doc?.locations?.[id];
    return l ? toPlain(l) : undefined;
  },

  // --- Prescription Drugs ---

  createPrescriptionDrug(input: CreatePrescriptionDrugInput): PrescriptionDrug {
    const id = uuidv4();
    const now = new Date().toISOString();
    const drug: PrescriptionDrug = stripUndefined({
      id,
      eventId: input.eventId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      durationDays: input.durationDays,
      createdAt: now,
    });
    handle!.change((d) => {
      if (!d.prescriptionDrugs) d.prescriptionDrugs = {};
      d.prescriptionDrugs[id] = drug;
    });
    return toPlain(handle!.doc()!.prescriptionDrugs[id]);
  },

  listPrescriptionDrugsByEvent(eventId: string): PrescriptionDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.prescriptionDrugs || {})
      .filter((d) => d.eventId === eventId)
      .map((d) => toPlain(d));
  },

  listAllPrescriptionDrugs(): PrescriptionDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.prescriptionDrugs || {}).map((d) => toPlain(d));
  },

  deletePrescriptionDrug(id: string): void {
    handle!.change((d) => {
      delete d.prescriptionDrugs[id];
    });
  },

  // --- Patient Drugs ---

  createPatientDrug(input: CreatePatientDrugInput): PatientDrug {
    const id = uuidv4();
    const now = new Date().toISOString();
    const drug: PatientDrug = stripUndefined({
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
    });
    handle!.change((d) => {
      if (!d.patientDrugs) d.patientDrugs = {};
      d.patientDrugs[id] = drug;
    });
    return toPlain(handle!.doc()!.patientDrugs[id]);
  },

  updatePatientDrug(id: string, input: UpdatePatientDrugInput): PatientDrug {
    const doc = getDoc();
    if (!doc?.patientDrugs?.[id]) throw new Error(`Tratamiento ${id} no encontrado`);
    handle!.change((d) => {
      const drug = d.patientDrugs[id];
      if (input.name !== undefined) drug.name = input.name;
      if (input.dosage !== undefined) drug.dosage = input.dosage;
      if (input.schedule !== undefined) drug.schedule = input.schedule;
      if (input.duration !== undefined) drug.duration = input.duration;
      if (input.startDate !== undefined) drug.startDate = input.startDate;
      if (input.startTime !== undefined) {
        if (input.startTime) drug.startTime = input.startTime;
        else delete drug.startTime;
      }
      if (input.endDate !== undefined) {
        if (input.endDate) drug.endDate = input.endDate;
        else delete drug.endDate;
      }
      if (input.isPermanent !== undefined) drug.isPermanent = input.isPermanent;
      if (input.nextPickupDate !== undefined) {
        if (input.nextPickupDate) drug.nextPickupDate = input.nextPickupDate;
        else delete drug.nextPickupDate;
      }
      if (input.status !== undefined) drug.status = input.status;
    });
    return toPlain(handle!.doc()!.patientDrugs[id]);
  },

  listPatientDrugsByPatient(patientId: string): PatientDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.patientDrugs || {})
      .filter((d) => d.patientId === patientId)
      .map((d) => toPlain(d));
  },

  listPatientDrugsByEvent(eventId: string): PatientDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.patientDrugs || {})
      .filter((d) => d.eventId === eventId)
      .map((d) => toPlain(d));
  },

  listActivePatientDrugs(patientId?: string): PatientDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    let results = Object.values(doc.patientDrugs || {}).filter((d) => d.status === "active");
    if (patientId) {
      results = results.filter((d) => d.patientId === patientId);
    }
    return results.map((d) => toPlain(d));
  },

  listAllPatientDrugs(): PatientDrug[] {
    const doc = getDoc();
    if (!doc) return [];
    return Object.values(doc.patientDrugs || {}).map((d) => toPlain(d));
  },

  deletePatientDrug(id: string): void {
    handle!.change((d) => {
      delete d.patientDrugs[id];
    });
  },

  // --- Utility ---

  getDocUrl(): string {
    return handle?.url ?? "";
  },
};

// ============= Message Handler =============

function handleRpc(msg: any): void {
  const { id, method, args } = msg;
  if (!handlers[method]) {
    self.postMessage({ id, error: `Unknown method: ${method}` });
    return;
  }
  try {
    const result = handlers[method](...(args || []));
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: (err as Error).message });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "init") {
    try {
      await init(msg.config as WorkerConfig);
    } catch (err) {
      self.postMessage({ type: "init-error", error: (err as Error).message });
    }
    return;
  }
  if (!initDone) {
    pendingMessages.push(e);
    return;
  }
  handleRpc(msg);
};

self.postMessage({ type: "ready" });

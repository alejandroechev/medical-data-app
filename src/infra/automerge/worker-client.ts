/**
 * Worker Client — main-thread proxy to the Automerge Web Worker.
 * Exposes the same API as all individual stores but all CRDT operations
 * execute in the worker. No Automerge WASM runs on the main thread.
 *
 * Blob operations (uploadPhoto, deletePhoto) stay on the main thread
 * since they don't involve CRDT processing.
 */

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
import type { UploadResult } from "../../domain/services/photo-uploader.js";
import { getAuthenticatedWsUrl } from "./auth.js";
import { storeAndSyncBlob, startBlobSyncListener } from "./blob-sync.js";

const DOC_URL_KEY = "medapp-automerge-doc-url";
const RPC_TIMEOUT_MS = 10_000;
const HAS_WORKER = typeof Worker !== "undefined";

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
>();
let changeListeners: Array<() => void> = [];
let initPromise: Promise<void> | null = null;

// --- Fallback: direct store access when Worker API is unavailable (test env) ---

type StoreModules = {
  event: typeof import("./medical-event-store.js");
  photo: typeof import("./event-photo-store.js");
  recording: typeof import("./recording-store.js");
  profLoc: typeof import("./professional-location-store.js");
  drug: typeof import("./prescription-drug-store.js");
};
let cachedStores: StoreModules | null = null;

async function getStores(): Promise<StoreModules> {
  if (!cachedStores) {
    const [event, photo, recording, profLoc, drug] = await Promise.all([
      import("./medical-event-store.js"),
      import("./event-photo-store.js"),
      import("./recording-store.js"),
      import("./professional-location-store.js"),
      import("./prescription-drug-store.js"),
    ]);
    cachedStores = { event, photo, recording, profLoc, drug };
  }
  return cachedStores;
}

const FALLBACK_MAP: Record<string, [keyof StoreModules, string]> = {
  createEvent: ["event", "createEvent"],
  getEventById: ["event", "getEventById"],
  listEvents: ["event", "listEvents"],
  updateEvent: ["event", "updateEvent"],
  archiveEvent: ["event", "archiveEvent"],
  unarchiveEvent: ["event", "unarchiveEvent"],
  deleteEvent: ["event", "deleteEvent"],
  linkPhoto: ["photo", "linkPhoto"],
  listPhotosByEvent: ["photo", "listPhotosByEvent"],
  unlinkPhoto: ["photo", "unlinkPhoto"],
  createRecording: ["recording", "createRecording"],
  listRecordingsByEvent: ["recording", "listRecordingsByEvent"],
  deleteRecording: ["recording", "deleteRecording"],
  createProfessional: ["profLoc", "createProfessional"],
  listProfessionals: ["profLoc", "listProfessionals"],
  getProfessionalById: ["profLoc", "getProfessionalById"],
  createLocation: ["profLoc", "createLocation"],
  listLocations: ["profLoc", "listLocations"],
  getLocationById: ["profLoc", "getLocationById"],
  createPrescriptionDrug: ["drug", "createPrescriptionDrug"],
  listPrescriptionDrugsByEvent: ["drug", "listPrescriptionDrugsByEvent"],
  listAllPrescriptionDrugs: ["drug", "listAllPrescriptionDrugs"],
  deletePrescriptionDrug: ["drug", "deletePrescriptionDrug"],
  createPatientDrug: ["drug", "createPatientDrug"],
  updatePatientDrug: ["drug", "updatePatientDrug"],
  listPatientDrugsByPatient: ["drug", "listPatientDrugsByPatient"],
  listPatientDrugsByEvent: ["drug", "listPatientDrugsByEvent"],
  listActivePatientDrugs: ["drug", "listActivePatientDrugs"],
  listAllPatientDrugs: ["drug", "listAllPatientDrugs"],
  deletePatientDrug: ["drug", "deletePatientDrug"],
};

async function fallbackCall<T>(method: string, args: any[]): Promise<T> {
  const stores = await getStores();
  const mapping = FALLBACK_MAP[method];
  if (!mapping) throw new Error(`Unknown method: ${method}`);
  const [storeKey, fn] = mapping;
  return (stores[storeKey] as any)[fn](...args);
}

// --- Worker RPC path ---

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;

    if (msg.type === "change") {
      for (const cb of changeListeners) cb();
      // Emit window event for compatibility with existing listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("medapp:doc-changed"));
      }
      return;
    }

    if (msg.type === "init-done") {
      if (msg.docUrl) {
        localStorage.setItem(DOC_URL_KEY, msg.docUrl);
      }
      return;
    }

    if (msg.type === "init-error") {
      console.error("[worker-client] Init error:", msg.error);
      return;
    }

    // RPC response
    const { id, result, error } = msg;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    clearTimeout(p.timer);
    if (error) {
      p.reject(new Error(error));
    } else {
      p.resolve(result);
    }
  };

  worker.onerror = (e) => {
    console.error("[worker-client] Worker error:", e);
    for (const [, p] of pending) {
      clearTimeout(p.timer);
      p.reject(new Error("Worker crashed"));
    }
    pending.clear();
  };

  return worker;
}

function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve) => {
    const w = getWorker();

    const wsUrl = getAuthenticatedWsUrl();
    const docUrl =
      import.meta.env.VITE_AUTOMERGE_DOC_URL ||
      localStorage.getItem(DOC_URL_KEY) || "";

    const timeout = setTimeout(() => {
      console.warn("[worker-client] Init timeout — proceeding anyway");
      resolve();
    }, 30_000);

    const handler = (e: MessageEvent) => {
      if (e.data.type === "ready") {
        w.postMessage({ type: "init", config: { wsUrl, docUrl } });
        return;
      }
      if (e.data.type === "init-done" || e.data.type === "init-error") {
        clearTimeout(timeout);
        w.removeEventListener("message", handler);
        // Start blob sync on main thread (needs window events)
        startBlobSyncListener();
        resolve();
      }
    };
    w.addEventListener("message", handler);
  });

  return initPromise;
}

function call<T>(method: string, ...args: any[]): Promise<T> {
  if (!HAS_WORKER) return fallbackCall<T>(method, args);

  return ensureInit().then(() => {
    return new Promise<T>((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }, RPC_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      getWorker().postMessage({ id, method, args });
    });
  });
}

// ============= Medical Events =============

export const createEvent = (input: CreateMedicalEventInput) =>
  call<MedicalEvent>("createEvent", input);
export const getEventById = (id: string) =>
  call<MedicalEvent | null>("getEventById", id);
export const listEvents = (filters?: MedicalEventFilters) =>
  call<MedicalEvent[]>("listEvents", filters);
export const updateEvent = (id: string, input: UpdateMedicalEventInput) =>
  call<MedicalEvent>("updateEvent", id, input);
export const archiveEvent = (id: string) =>
  call<void>("archiveEvent", id);
export const unarchiveEvent = (id: string) =>
  call<void>("unarchiveEvent", id);
export const deleteEvent = (id: string) =>
  call<void>("deleteEvent", id);

// ============= Event Photos =============

export const linkPhoto = (input: LinkPhotoInput) =>
  call<EventPhoto>("linkPhoto", input);
export const listPhotosByEvent = (eventId: string) =>
  call<EventPhoto[]>("listPhotosByEvent", eventId);
export const unlinkPhoto = (id: string) =>
  call<void>("unlinkPhoto", id);

// Blob operations stay on main thread (no CRDT involved)
export async function uploadPhoto(_eventId: string, file: File): Promise<UploadResult> {
  const { blobId, localUrl } = await storeAndSyncBlob(file);
  return { url: localUrl, fileName: `blob:${blobId}` };
}

export async function deletePhoto(_url: string): Promise<void> {
  // Blob GC handled server-side (Phase 5)
}

// ============= Recordings =============

export const createRecording = (input: CreateRecordingInput) =>
  call<EventRecording>("createRecording", input);
export const listRecordingsByEvent = (eventId: string) =>
  call<EventRecording[]>("listRecordingsByEvent", eventId);
export const deleteRecording = (id: string) =>
  call<void>("deleteRecording", id);

// ============= Professionals =============

export const createProfessional = (name: string, specialty?: string) =>
  call<Professional>("createProfessional", name, specialty);
export const listProfessionals = () =>
  call<Professional[]>("listProfessionals");
export const getProfessionalById = (id: string) =>
  call<Professional | undefined>("getProfessionalById", id);

// ============= Locations =============

export const createLocation = (name: string) =>
  call<Location>("createLocation", name);
export const listLocations = () =>
  call<Location[]>("listLocations");
export const getLocationById = (id: string) =>
  call<Location | undefined>("getLocationById", id);

// ============= Prescription Drugs =============

export const createPrescriptionDrug = (input: CreatePrescriptionDrugInput) =>
  call<PrescriptionDrug>("createPrescriptionDrug", input);
export const listPrescriptionDrugsByEvent = (eventId: string) =>
  call<PrescriptionDrug[]>("listPrescriptionDrugsByEvent", eventId);
export const listAllPrescriptionDrugs = () =>
  call<PrescriptionDrug[]>("listAllPrescriptionDrugs");
export const deletePrescriptionDrug = (id: string) =>
  call<void>("deletePrescriptionDrug", id);

// ============= Patient Drugs =============

export const createPatientDrug = (input: CreatePatientDrugInput) =>
  call<PatientDrug>("createPatientDrug", input);
export const updatePatientDrug = (id: string, input: UpdatePatientDrugInput) =>
  call<PatientDrug>("updatePatientDrug", id, input);
export const listPatientDrugsByPatient = (patientId: string) =>
  call<PatientDrug[]>("listPatientDrugsByPatient", patientId);
export const listPatientDrugsByEvent = (eventId: string) =>
  call<PatientDrug[]>("listPatientDrugsByEvent", eventId);
export const listActivePatientDrugs = (patientId?: string) =>
  call<PatientDrug[]>("listActivePatientDrugs", patientId);
export const listAllPatientDrugs = () =>
  call<PatientDrug[]>("listAllPatientDrugs");
export const deletePatientDrug = (id: string) =>
  call<void>("deletePatientDrug", id);

// ============= Doc change subscription =============

export function onDocChange(callback: () => void): () => void {
  changeListeners.push(callback);
  ensureInit();
  return () => {
    changeListeners = changeListeners.filter((cb) => cb !== callback);
  };
}

// ============= Utility =============

export const getDocUrl = () => call<string>("getDocUrl");

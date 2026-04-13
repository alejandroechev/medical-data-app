/**
 * Store Provider — selects between Supabase, Automerge (local-first), or in-memory stores.
 *
 * Priority: VITE_STORAGE_BACKEND env var → Supabase (if configured) → in-memory fallback
 *   - 'automerge': Local-first with CRDT sync via Automerge
 *   - 'supabase':  Cloud-first via Supabase PostgreSQL
 *   - 'memory':    Ephemeral in-memory (dev/test)
 */
import { supabase } from './supabase/client.js';
import * as supabaseEventStore from './supabase/medical-event-store.js';
import * as supabasePhotoStore from './supabase/event-photo-store.js';
import * as supabasePhotoStorage from './supabase/photo-storage.js';
import * as supabaseRecordingStore from './supabase/recording-store.js';
import * as supabaseProfLocStore from './supabase/professional-location-store.js';
import * as supabaseDrugStore from './supabase/prescription-drug-store.js';

// Automerge stores are loaded lazily to avoid pulling WASM into non-automerge builds
const automerge = () => ({
  event: import('./automerge/medical-event-store.js'),
  photo: import('./automerge/event-photo-store.js'),
  recording: import('./automerge/recording-store.js'),
  profLoc: import('./automerge/professional-location-store.js'),
  drug: import('./automerge/prescription-drug-store.js'),
});
import { InMemoryMedicalEventStore } from './memory/medical-event-store.js';
import { InMemoryEventPhotoStore } from './memory/event-photo-store.js';
import { InMemoryPhotoUploader } from './memory/photo-uploader.js';
import { InMemoryRecordingStore } from './memory/recording-store.js';
import { InMemoryProfessionalStore, InMemoryLocationStore } from './memory/professional-location-store.js';
import { InMemoryPrescriptionDrugStore, InMemoryPatientDrugStore } from './memory/prescription-drug-store.js';
import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../domain/models/medical-event.js';
import type { EventPhoto, LinkPhotoInput } from '../domain/models/event-photo.js';
import type { EventRecording, CreateRecordingInput } from '../domain/models/event-recording.js';
import type { PrescriptionDrug, CreatePrescriptionDrugInput, PatientDrug, CreatePatientDrugInput, UpdatePatientDrugInput } from '../domain/models/prescription-drug.js';
import type { Professional, Location } from '../domain/models/professional-location.js';
import type { MedicalEventFilters } from '../domain/services/medical-event-repository.js';
import type { UploadResult } from '../domain/services/photo-uploader.js';

type StorageBackend = 'supabase' | 'automerge' | 'memory';

function detectBackend(): StorageBackend {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const explicit = viteEnv?.VITE_STORAGE_BACKEND ?? process.env.VITE_STORAGE_BACKEND;
  if (explicit === 'automerge') return 'automerge';
  if (explicit === 'memory') return 'memory';
  if (explicit === 'supabase' || supabase !== null) return 'supabase';
  return 'memory';
}

const backend = detectBackend();

// Singleton in-memory stores (only used when backend === 'memory')
const memoryEventStore = new InMemoryMedicalEventStore();
const memoryPhotoStore = new InMemoryEventPhotoStore();
const memoryPhotoUploader = new InMemoryPhotoUploader();
const memoryRecordingStore = new InMemoryRecordingStore();
const memoryProfessionalStore = new InMemoryProfessionalStore();
const memoryLocationStore = new InMemoryLocationStore();
const memoryDrugStore = new InMemoryPrescriptionDrugStore();
const memoryPatientDrugStore = new InMemoryPatientDrugStore();

export function isUsingSupabase(): boolean {
  return backend === 'supabase';
}

export function isUsingAutomerge(): boolean {
  return backend === 'automerge';
}

export function getStorageBackend(): StorageBackend {
  return backend;
}

// --- Medical Events ---

export async function createEvent(input: CreateMedicalEventInput): Promise<MedicalEvent> {
  if (backend === 'automerge') return (await automerge().event).createEvent(input);
  return backend === 'supabase' ? supabaseEventStore.createEvent(input) : memoryEventStore.create(input);
}

export async function getEventById(id: string): Promise<MedicalEvent | null> {
  if (backend === 'automerge') return (await automerge().event).getEventById(id);
  return backend === 'supabase' ? supabaseEventStore.getEventById(id) : memoryEventStore.getById(id);
}

export async function listEvents(filters?: MedicalEventFilters): Promise<MedicalEvent[]> {
  if (backend === 'automerge') return (await automerge().event).listEvents(filters);
  return backend === 'supabase' ? supabaseEventStore.listEvents(filters) : memoryEventStore.list(filters);
}

export async function updateEvent(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
  if (backend === 'automerge') return (await automerge().event).updateEvent(id, input);
  return backend === 'supabase' ? supabaseEventStore.updateEvent(id, input) : memoryEventStore.update(id, input);
}

export async function deleteEvent(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().event).deleteEvent(id);
  return backend === 'supabase' ? supabaseEventStore.deleteEvent(id) : memoryEventStore.delete(id);
}

export async function archiveEvent(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().event).archiveEvent(id);
  if (backend === 'supabase') {
    await supabaseEventStore.updateEvent(id, { isArchived: true });
    return;
  }
  await memoryEventStore.update(id, { isArchived: true });
}

export async function unarchiveEvent(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().event).unarchiveEvent(id);
  if (backend === 'supabase') {
    await supabaseEventStore.updateEvent(id, { isArchived: false });
    return;
  }
  await memoryEventStore.update(id, { isArchived: false });
}

// --- Event Photos ---

export async function linkPhoto(input: LinkPhotoInput): Promise<EventPhoto> {
  if (backend === 'automerge') return (await automerge().photo).linkPhoto(input);
  return backend === 'supabase' ? supabasePhotoStore.linkPhoto(input) : memoryPhotoStore.link(input);
}

export async function listPhotosByEvent(eventId: string): Promise<EventPhoto[]> {
  if (backend === 'automerge') return (await automerge().photo).listPhotosByEvent(eventId);
  return backend === 'supabase' ? supabasePhotoStore.listPhotosByEvent(eventId) : memoryPhotoStore.listByEvent(eventId);
}

export async function unlinkPhoto(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().photo).unlinkPhoto(id);
  return backend === 'supabase' ? supabasePhotoStore.unlinkPhoto(id) : memoryPhotoStore.unlink(id);
}

// --- Photo Storage ---

export async function uploadPhoto(eventId: string, file: File): Promise<UploadResult> {
  if (backend === 'automerge') return (await automerge().photo).uploadPhoto(eventId, file);
  return backend === 'supabase' ? supabasePhotoStorage.uploadPhoto(eventId, file) : memoryPhotoUploader.upload(eventId, file);
}

export async function deleteStoredPhoto(url: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().photo).deletePhoto(url);
  return backend === 'supabase' ? supabasePhotoStorage.deletePhoto(url) : memoryPhotoUploader.delete(url);
}

// --- Recordings ---

export async function createRecording(input: CreateRecordingInput): Promise<EventRecording> {
  if (backend === 'automerge') return (await automerge().recording).createRecording(input);
  return backend === 'supabase' ? supabaseRecordingStore.createRecording(input) : memoryRecordingStore.create(input);
}

export async function listRecordingsByEvent(eventId: string): Promise<EventRecording[]> {
  if (backend === 'automerge') return (await automerge().recording).listRecordingsByEvent(eventId);
  return backend === 'supabase' ? supabaseRecordingStore.listRecordingsByEvent(eventId) : memoryRecordingStore.listByEvent(eventId);
}

export async function deleteRecording(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().recording).deleteRecording(id);
  return backend === 'supabase' ? supabaseRecordingStore.deleteRecording(id) : memoryRecordingStore.delete(id);
}

// --- Professionals ---

export async function createProfessional(name: string, specialty?: string): Promise<Professional> {
  if (backend === 'automerge') return (await automerge().profLoc).createProfessional(name, specialty);
  return backend === 'supabase' ? supabaseProfLocStore.createProfessional(name, specialty) : memoryProfessionalStore.create(name, specialty);
}

export async function listProfessionals(): Promise<Professional[]> {
  if (backend === 'automerge') return (await automerge().profLoc).listProfessionals();
  return backend === 'supabase' ? supabaseProfLocStore.listProfessionals() : memoryProfessionalStore.list();
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  if (backend === 'automerge') return (await automerge().profLoc).getProfessionalById(id);
  return backend === 'supabase' ? supabaseProfLocStore.getProfessionalById(id) : memoryProfessionalStore.getById(id);
}

// --- Locations ---

export async function createLocation(name: string): Promise<Location> {
  if (backend === 'automerge') return (await automerge().profLoc).createLocation(name);
  return backend === 'supabase' ? supabaseProfLocStore.createLocation(name) : memoryLocationStore.create(name);
}

export async function listLocations(): Promise<Location[]> {
  if (backend === 'automerge') return (await automerge().profLoc).listLocations();
  return backend === 'supabase' ? supabaseProfLocStore.listLocations() : memoryLocationStore.list();
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  if (backend === 'automerge') return (await automerge().profLoc).getLocationById(id);
  return backend === 'supabase' ? supabaseProfLocStore.getLocationById(id) : memoryLocationStore.getById(id);
}

// --- Prescription Drugs ---

export async function createPrescriptionDrug(input: CreatePrescriptionDrugInput): Promise<PrescriptionDrug> {
  if (backend === 'automerge') return (await automerge().drug).createPrescriptionDrug(input);
  return backend === 'supabase' ? supabaseDrugStore.createPrescriptionDrug(input) : memoryDrugStore.create(input);
}

export async function listPrescriptionDrugsByEvent(eventId: string): Promise<PrescriptionDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listPrescriptionDrugsByEvent(eventId);
  return backend === 'supabase' ? supabaseDrugStore.listPrescriptionDrugsByEvent(eventId) : memoryDrugStore.listByEvent(eventId);
}

export async function listAllPrescriptionDrugs(): Promise<PrescriptionDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listAllPrescriptionDrugs();
  return backend === 'supabase' ? supabaseDrugStore.listAllPrescriptionDrugs() : memoryDrugStore.listAll();
}

export async function deletePrescriptionDrug(id: string): Promise<void> {
  if (backend === 'automerge') return (await automerge().drug).deletePrescriptionDrug(id);
  return backend === 'supabase' ? supabaseDrugStore.deletePrescriptionDrug(id) : memoryDrugStore.delete(id);
}

// --- Patient Drugs (first-class treatments) ---

function notifyDrugsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('medapp:drugs-changed'));
  }
}

export async function createPatientDrug(input: CreatePatientDrugInput): Promise<PatientDrug> {
  let result: PatientDrug;
  if (backend === 'automerge') result = await (await automerge().drug).createPatientDrug(input);
  else result = backend === 'supabase' ? await supabaseDrugStore.createPatientDrug(input) : await memoryPatientDrugStore.create(input);
  notifyDrugsChanged();
  return result;
}

export async function updatePatientDrug(id: string, input: UpdatePatientDrugInput): Promise<PatientDrug> {
  let result: PatientDrug;
  if (backend === 'automerge') result = await (await automerge().drug).updatePatientDrug(id, input);
  else result = backend === 'supabase' ? await supabaseDrugStore.updatePatientDrug(id, input) : await memoryPatientDrugStore.update(id, input);
  notifyDrugsChanged();
  return result;
}

export async function listPatientDrugsByPatient(patientId: string): Promise<PatientDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listPatientDrugsByPatient(patientId);
  return backend === 'supabase' ? supabaseDrugStore.listPatientDrugsByPatient(patientId) : memoryPatientDrugStore.listByPatient(patientId);
}

export async function listPatientDrugsByEvent(eventId: string): Promise<PatientDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listPatientDrugsByEvent(eventId);
  return backend === 'supabase' ? supabaseDrugStore.listPatientDrugsByEvent(eventId) : memoryPatientDrugStore.listByEvent(eventId);
}

export async function listActivePatientDrugs(patientId?: string): Promise<PatientDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listActivePatientDrugs(patientId);
  return backend === 'supabase' ? supabaseDrugStore.listActivePatientDrugs(patientId) : memoryPatientDrugStore.listActive(patientId);
}

export async function listAllPatientDrugs(): Promise<PatientDrug[]> {
  if (backend === 'automerge') return (await automerge().drug).listAllPatientDrugs();
  return backend === 'supabase' ? supabaseDrugStore.listAllPatientDrugs() : memoryPatientDrugStore.listAll();
}

export async function deletePatientDrug(id: string): Promise<void> {
  if (backend === 'automerge') await (await automerge().drug).deletePatientDrug(id);
  else backend === 'supabase' ? await supabaseDrugStore.deletePatientDrug(id) : await memoryPatientDrugStore.delete(id);
  notifyDrugsChanged();
}

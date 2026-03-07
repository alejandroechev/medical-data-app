/**
 * Store Provider — auto-selects between Supabase (real) and in-memory (stub) stores.
 * When Supabase environment variables are not configured, falls back to in-memory stores.
 */
import { supabase } from './supabase/client.js';
import * as supabaseEventStore from './supabase/medical-event-store.js';
import * as supabasePhotoStore from './supabase/event-photo-store.js';
import * as supabasePhotoStorage from './supabase/photo-storage.js';
import * as supabaseRecordingStore from './supabase/recording-store.js';
import * as supabaseProfLocStore from './supabase/professional-location-store.js';
import * as supabaseDrugStore from './supabase/prescription-drug-store.js';
import { InMemoryMedicalEventStore } from './memory/medical-event-store.js';
import { InMemoryEventPhotoStore } from './memory/event-photo-store.js';
import { InMemoryPhotoUploader } from './memory/photo-uploader.js';
import { InMemoryRecordingStore } from './memory/recording-store.js';
import { InMemoryProfessionalStore, InMemoryLocationStore } from './memory/professional-location-store.js';
import { InMemoryPrescriptionDrugStore } from './memory/prescription-drug-store.js';
import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../domain/models/medical-event.js';
import type { EventPhoto, LinkPhotoInput } from '../domain/models/event-photo.js';
import type { EventRecording, CreateRecordingInput } from '../domain/models/event-recording.js';
import type { PrescriptionDrug, CreatePrescriptionDrugInput } from '../domain/models/prescription-drug.js';
import type { Professional, Location } from '../domain/models/professional-location.js';
import type { MedicalEventFilters } from '../domain/services/medical-event-repository.js';
import type { UploadResult } from '../domain/services/photo-uploader.js';

const useSupabase = supabase !== null;

// Singleton in-memory stores (shared across the app when Supabase is unavailable)
const memoryEventStore = new InMemoryMedicalEventStore();
const memoryPhotoStore = new InMemoryEventPhotoStore();
const memoryPhotoUploader = new InMemoryPhotoUploader();
const memoryRecordingStore = new InMemoryRecordingStore();
const memoryProfessionalStore = new InMemoryProfessionalStore();
const memoryLocationStore = new InMemoryLocationStore();
const memoryDrugStore = new InMemoryPrescriptionDrugStore();

export function isUsingSupabase(): boolean {
  return useSupabase;
}

// --- Medical Events ---

export async function createEvent(input: CreateMedicalEventInput): Promise<MedicalEvent> {
  return useSupabase ? supabaseEventStore.createEvent(input) : memoryEventStore.create(input);
}

export async function getEventById(id: string): Promise<MedicalEvent | null> {
  return useSupabase ? supabaseEventStore.getEventById(id) : memoryEventStore.getById(id);
}

export async function listEvents(filters?: MedicalEventFilters): Promise<MedicalEvent[]> {
  return useSupabase ? supabaseEventStore.listEvents(filters) : memoryEventStore.list(filters);
}

export async function updateEvent(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
  return useSupabase ? supabaseEventStore.updateEvent(id, input) : memoryEventStore.update(id, input);
}

export async function deleteEvent(id: string): Promise<void> {
  return useSupabase ? supabaseEventStore.deleteEvent(id) : memoryEventStore.delete(id);
}

// --- Event Photos ---

export async function linkPhoto(input: LinkPhotoInput): Promise<EventPhoto> {
  return useSupabase ? supabasePhotoStore.linkPhoto(input) : memoryPhotoStore.link(input);
}

export async function listPhotosByEvent(eventId: string): Promise<EventPhoto[]> {
  return useSupabase ? supabasePhotoStore.listPhotosByEvent(eventId) : memoryPhotoStore.listByEvent(eventId);
}

export async function unlinkPhoto(id: string): Promise<void> {
  return useSupabase ? supabasePhotoStore.unlinkPhoto(id) : memoryPhotoStore.unlink(id);
}

// --- Photo Storage ---

export async function uploadPhoto(eventId: string, file: File): Promise<UploadResult> {
  return useSupabase ? supabasePhotoStorage.uploadPhoto(eventId, file) : memoryPhotoUploader.upload(eventId, file);
}

export async function deleteStoredPhoto(url: string): Promise<void> {
  return useSupabase ? supabasePhotoStorage.deletePhoto(url) : memoryPhotoUploader.delete(url);
}

// --- Recordings ---

export async function createRecording(input: CreateRecordingInput): Promise<EventRecording> {
  return useSupabase ? supabaseRecordingStore.createRecording(input) : memoryRecordingStore.create(input);
}

export async function listRecordingsByEvent(eventId: string): Promise<EventRecording[]> {
  return useSupabase ? supabaseRecordingStore.listRecordingsByEvent(eventId) : memoryRecordingStore.listByEvent(eventId);
}

export async function deleteRecording(id: string): Promise<void> {
  return useSupabase ? supabaseRecordingStore.deleteRecording(id) : memoryRecordingStore.delete(id);
}

// --- Professionals ---

export async function createProfessional(name: string, specialty?: string): Promise<Professional> {
  return useSupabase ? supabaseProfLocStore.createProfessional(name, specialty) : memoryProfessionalStore.create(name, specialty);
}

export async function listProfessionals(): Promise<Professional[]> {
  return useSupabase ? supabaseProfLocStore.listProfessionals() : memoryProfessionalStore.list();
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  return useSupabase ? supabaseProfLocStore.getProfessionalById(id) : memoryProfessionalStore.getById(id);
}

// --- Locations ---

export async function createLocation(name: string): Promise<Location> {
  return useSupabase ? supabaseProfLocStore.createLocation(name) : memoryLocationStore.create(name);
}

export async function listLocations(): Promise<Location[]> {
  return useSupabase ? supabaseProfLocStore.listLocations() : memoryLocationStore.list();
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  return useSupabase ? supabaseProfLocStore.getLocationById(id) : memoryLocationStore.getById(id);
}

// --- Prescription Drugs ---

export async function createPrescriptionDrug(input: CreatePrescriptionDrugInput): Promise<PrescriptionDrug> {
  return useSupabase ? supabaseDrugStore.createPrescriptionDrug(input) : memoryDrugStore.create(input);
}

export async function listPrescriptionDrugsByEvent(eventId: string): Promise<PrescriptionDrug[]> {
  return useSupabase ? supabaseDrugStore.listPrescriptionDrugsByEvent(eventId) : memoryDrugStore.listByEvent(eventId);
}

export async function deletePrescriptionDrug(id: string): Promise<void> {
  return useSupabase ? supabaseDrugStore.deletePrescriptionDrug(id) : memoryDrugStore.delete(id);
}

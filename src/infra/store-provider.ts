/**
 * Store Provider — auto-selects between Supabase (real) and in-memory (stub) stores.
 * When Supabase environment variables are not configured, falls back to in-memory stores.
 */
import { supabase } from './supabase/client.js';
import * as supabaseEventStore from './supabase/medical-event-store.js';
import * as supabasePhotoStore from './supabase/event-photo-store.js';
import { InMemoryMedicalEventStore } from './memory/medical-event-store.js';
import { InMemoryEventPhotoStore } from './memory/event-photo-store.js';
import type { MedicalEvent, CreateMedicalEventInput, UpdateMedicalEventInput } from '../domain/models/medical-event.js';
import type { EventPhoto, LinkPhotoInput } from '../domain/models/event-photo.js';
import type { MedicalEventFilters } from '../domain/services/medical-event-repository.js';

const useSupabase = supabase !== null;

// Singleton in-memory stores (shared across the app when Supabase is unavailable)
const memoryEventStore = new InMemoryMedicalEventStore();
const memoryPhotoStore = new InMemoryEventPhotoStore();

export function isUsingSupabase(): boolean {
  return useSupabase;
}

// --- Medical Events ---

export async function crearEvento(input: CreateMedicalEventInput): Promise<MedicalEvent> {
  return useSupabase ? supabaseEventStore.crearEvento(input) : memoryEventStore.crear(input);
}

export async function obtenerEventoPorId(id: string): Promise<MedicalEvent | null> {
  return useSupabase ? supabaseEventStore.obtenerEventoPorId(id) : memoryEventStore.obtenerPorId(id);
}

export async function listarEventos(filtros?: MedicalEventFilters): Promise<MedicalEvent[]> {
  return useSupabase ? supabaseEventStore.listarEventos(filtros) : memoryEventStore.listar(filtros);
}

export async function actualizarEvento(id: string, input: UpdateMedicalEventInput): Promise<MedicalEvent> {
  return useSupabase ? supabaseEventStore.actualizarEvento(id, input) : memoryEventStore.actualizar(id, input);
}

export async function eliminarEvento(id: string): Promise<void> {
  return useSupabase ? supabaseEventStore.eliminarEvento(id) : memoryEventStore.eliminar(id);
}

// --- Event Photos ---

export async function vincularFoto(input: LinkPhotoInput): Promise<EventPhoto> {
  return useSupabase ? supabasePhotoStore.vincularFoto(input) : memoryPhotoStore.vincular(input);
}

export async function listarFotosPorEvento(eventoId: string): Promise<EventPhoto[]> {
  return useSupabase ? supabasePhotoStore.listarFotosPorEvento(eventoId) : memoryPhotoStore.listarPorEvento(eventoId);
}

export async function desvincularFoto(id: string): Promise<void> {
  return useSupabase ? supabasePhotoStore.desvincularFoto(id) : memoryPhotoStore.desvincular(id);
}

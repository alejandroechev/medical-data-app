import { supabase } from './client.js';
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
} from '../../domain/models/medical-event.js';
import type { MedicalEventFilters } from '../../domain/services/medical-event-repository.js';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase no configurado. Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

interface DbMedicalEvent {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  paciente_id: string;
  reembolso_isapre: boolean;
  reembolso_seguro: boolean;
  creado_en: string;
  actualizado_en: string;
}

function mapFromDb(row: DbMedicalEvent): MedicalEvent {
  return {
    id: row.id,
    date: row.fecha,
    type: row.tipo as MedicalEvent['type'],
    description: row.descripcion,
    patientId: row.paciente_id,
    isapreReimbursed: row.reembolso_isapre,
    insuranceReimbursed: row.reembolso_seguro,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

export async function createEvent(
  input: CreateMedicalEventInput
): Promise<MedicalEvent> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('medical_events')
    .insert({
      fecha: input.date,
      tipo: input.type,
      descripcion: input.description,
      paciente_id: input.patientId,
      reembolso_isapre: input.isapreReimbursed ?? false,
      reembolso_seguro: input.insuranceReimbursed ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear evento: ${error.message}`);
  return mapFromDb(data as DbMedicalEvent);
}

export async function getEventById(
  id: string
): Promise<MedicalEvent | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('medical_events')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error al obtener evento: ${error.message}`);
  }
  return mapFromDb(data as DbMedicalEvent);
}

export async function listEvents(
  filters?: MedicalEventFilters
): Promise<MedicalEvent[]> {
  const db = requireSupabase();
  let query = db
    .from('medical_events')
    .select()
    .order('fecha', { ascending: false });

  if (filters?.patientId) {
    query = query.eq('paciente_id', filters.patientId);
  }
  if (filters?.type) {
    query = query.eq('tipo', filters.type);
  }
  if (filters?.from) {
    query = query.gte('fecha', filters.from);
  }
  if (filters?.to) {
    query = query.lte('fecha', filters.to);
  }
  if (filters?.isapreReimbursed !== undefined) {
    query = query.eq('reembolso_isapre', filters.isapreReimbursed);
  }
  if (filters?.insuranceReimbursed !== undefined) {
    query = query.eq('reembolso_seguro', filters.insuranceReimbursed);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al listar eventos: ${error.message}`);
  return (data as DbMedicalEvent[]).map(mapFromDb);
}

export async function updateEvent(
  id: string,
  input: UpdateMedicalEventInput
): Promise<MedicalEvent> {
  const db = requireSupabase();
  const updateData: Record<string, unknown> = {};
  if (input.date !== undefined) updateData.fecha = input.date;
  if (input.type !== undefined) updateData.tipo = input.type;
  if (input.description !== undefined) updateData.descripcion = input.description;
  if (input.patientId !== undefined) updateData.paciente_id = input.patientId;
  if (input.isapreReimbursed !== undefined)
    updateData.reembolso_isapre = input.isapreReimbursed;
  if (input.insuranceReimbursed !== undefined)
    updateData.reembolso_seguro = input.insuranceReimbursed;

  const { data, error } = await db
    .from('medical_events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar evento: ${error.message}`);
  return mapFromDb(data as DbMedicalEvent);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('medical_events')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar evento: ${error.message}`);
}

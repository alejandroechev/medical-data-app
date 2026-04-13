import { supabase } from './client.js';
import type {
  MedicalEvent,
  CreateMedicalEventInput,
  UpdateMedicalEventInput,
  ReimbursementStatus,
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
  is_archived?: boolean | null;
  professional_id: string | null;
  location_id: string | null;
  parent_event_id: string | null;
  reembolso_isapre_status: string;
  reembolso_seguro_status: string;
  costo: number | null;
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
    ...(row.is_archived !== null && row.is_archived !== undefined && { isArchived: row.is_archived }),
    ...(row.professional_id !== null && { professionalId: row.professional_id }),
    ...(row.location_id !== null && { locationId: row.location_id }),
    ...(row.parent_event_id !== null && { parentEventId: row.parent_event_id }),
    ...(row.costo !== null && { cost: row.costo }),
    isapreReimbursementStatus: (row.reembolso_isapre_status ?? 'none') as ReimbursementStatus,
    insuranceReimbursementStatus: (row.reembolso_seguro_status ?? 'none') as ReimbursementStatus,
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
      is_archived: false,
      professional_id: input.professionalId ?? null,
      location_id: input.locationId ?? null,
      parent_event_id: input.parentEventId ?? null,
      reembolso_isapre_status: input.isapreReimbursementStatus ?? 'none',
      reembolso_seguro_status: input.insuranceReimbursementStatus ?? 'none',
      costo: input.cost ?? null,
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
  if (!filters?.includeArchived) {
    query = query.or('is_archived.is.null,is_archived.eq.false');
  }
  if (filters?.isapreReimbursementStatus !== undefined) {
    query = query.eq('reembolso_isapre_status', filters.isapreReimbursementStatus);
  }
  if (filters?.insuranceReimbursementStatus !== undefined) {
    query = query.eq('reembolso_seguro_status', filters.insuranceReimbursementStatus);
  }
  if (filters?.professionalId) {
    query = query.eq('professional_id', filters.professionalId);
  }
  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId);
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
  if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;
  if (input.professionalId !== undefined)
    updateData.professional_id = input.professionalId;
  if (input.locationId !== undefined)
    updateData.location_id = input.locationId;
  if (input.parentEventId !== undefined)
    updateData.parent_event_id = input.parentEventId;
  if (input.isapreReimbursementStatus !== undefined)
    updateData.reembolso_isapre_status = input.isapreReimbursementStatus;
  if (input.insuranceReimbursementStatus !== undefined)
    updateData.reembolso_seguro_status = input.insuranceReimbursementStatus;
  if (input.cost !== undefined) updateData.costo = input.cost;

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

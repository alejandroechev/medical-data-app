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
    fecha: row.fecha,
    tipo: row.tipo as MedicalEvent['tipo'],
    descripcion: row.descripcion,
    pacienteId: row.paciente_id,
    reembolsoIsapre: row.reembolso_isapre,
    reembolsoSeguro: row.reembolso_seguro,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

export async function crearEvento(
  input: CreateMedicalEventInput
): Promise<MedicalEvent> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('medical_events')
    .insert({
      fecha: input.fecha,
      tipo: input.tipo,
      descripcion: input.descripcion,
      paciente_id: input.pacienteId,
      reembolso_isapre: input.reembolsoIsapre ?? false,
      reembolso_seguro: input.reembolsoSeguro ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear evento: ${error.message}`);
  return mapFromDb(data as DbMedicalEvent);
}

export async function obtenerEventoPorId(
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

export async function listarEventos(
  filtros?: MedicalEventFilters
): Promise<MedicalEvent[]> {
  const db = requireSupabase();
  let query = db
    .from('medical_events')
    .select()
    .order('fecha', { ascending: false });

  if (filtros?.pacienteId) {
    query = query.eq('paciente_id', filtros.pacienteId);
  }
  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }
  if (filtros?.desde) {
    query = query.gte('fecha', filtros.desde);
  }
  if (filtros?.hasta) {
    query = query.lte('fecha', filtros.hasta);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al listar eventos: ${error.message}`);
  return (data as DbMedicalEvent[]).map(mapFromDb);
}

export async function actualizarEvento(
  id: string,
  input: UpdateMedicalEventInput
): Promise<MedicalEvent> {
  const db = requireSupabase();
  const updateData: Record<string, unknown> = {};
  if (input.fecha !== undefined) updateData.fecha = input.fecha;
  if (input.tipo !== undefined) updateData.tipo = input.tipo;
  if (input.descripcion !== undefined) updateData.descripcion = input.descripcion;
  if (input.pacienteId !== undefined) updateData.paciente_id = input.pacienteId;
  if (input.reembolsoIsapre !== undefined)
    updateData.reembolso_isapre = input.reembolsoIsapre;
  if (input.reembolsoSeguro !== undefined)
    updateData.reembolso_seguro = input.reembolsoSeguro;

  const { data, error } = await db
    .from('medical_events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar evento: ${error.message}`);
  return mapFromDb(data as DbMedicalEvent);
}

export async function eliminarEvento(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('medical_events')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar evento: ${error.message}`);
}

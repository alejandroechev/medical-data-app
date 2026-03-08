import { supabase } from './client.js';
import type { PrescriptionDrug, CreatePrescriptionDrugInput } from '../../domain/models/prescription-drug.js';

interface DbPrescriptionDrug {
  id: string;
  event_id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  created_at: string;
}

function mapFromDb(row: DbPrescriptionDrug): PrescriptionDrug {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    durationDays: row.duration_days ?? undefined,
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase not configured.');
  return supabase;
}

export async function createPrescriptionDrug(input: CreatePrescriptionDrugInput): Promise<PrescriptionDrug> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('prescription_drugs')
    .insert({
      event_id: input.eventId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      duration_days: input.durationDays ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al guardar medicamento: ${error.message}`);
  return mapFromDb(data as DbPrescriptionDrug);
}

export async function listPrescriptionDrugsByEvent(eventId: string): Promise<PrescriptionDrug[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('prescription_drugs')
    .select()
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Error al listar medicamentos: ${error.message}`);
  return (data as DbPrescriptionDrug[]).map(mapFromDb);
}

export async function listAllPrescriptionDrugs(): Promise<PrescriptionDrug[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('prescription_drugs')
    .select()
    .order('name', { ascending: true });

  if (error) throw new Error(`Error al listar medicamentos: ${error.message}`);
  return (data as DbPrescriptionDrug[]).map(mapFromDb);
}

export async function deletePrescriptionDrug(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('prescription_drugs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar medicamento: ${error.message}`);
}

import { supabase } from './client.js';
import type { PrescriptionDrug, CreatePrescriptionDrugInput, PatientDrug, CreatePatientDrugInput, UpdatePatientDrugInput, DrugSchedule, DrugDuration, DrugStatus } from '../../domain/models/prescription-drug.js';

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

// --- Patient Drug (first-class) ---

interface DbPatientDrug {
  id: string;
  patient_id: string;
  event_id: string | null;
  name: string;
  dosage: string;
  schedule: string; // JSON
  duration: string; // JSON
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  is_permanent: boolean;
  next_pickup_date: string | null;
  status: string;
  created_at: string;
}

function mapPatientDrugFromDb(row: DbPatientDrug): PatientDrug {
  return {
    id: row.id,
    patientId: row.patient_id,
    ...(row.event_id !== null && { eventId: row.event_id }),
    name: row.name,
    dosage: row.dosage,
    schedule: JSON.parse(row.schedule) as DrugSchedule,
    duration: JSON.parse(row.duration) as DrugDuration,
    startDate: row.start_date,
    ...(row.start_time !== null && { startTime: row.start_time }),
    ...(row.end_date !== null && { endDate: row.end_date }),
    isPermanent: row.is_permanent,
    ...(row.next_pickup_date !== null && { nextPickupDate: row.next_pickup_date }),
    status: row.status as DrugStatus,
    createdAt: row.created_at,
  };
}

export async function createPatientDrug(input: CreatePatientDrugInput): Promise<PatientDrug> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('patient_drugs')
    .insert({
      patient_id: input.patientId,
      event_id: input.eventId ?? null,
      name: input.name,
      dosage: input.dosage,
      schedule: JSON.stringify(input.schedule),
      duration: JSON.stringify(input.duration),
      start_date: input.startDate,
      start_time: input.startTime ?? null,
      is_permanent: input.isPermanent ?? false,
      next_pickup_date: input.nextPickupDate ?? null,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear tratamiento: ${error.message}`);
  return mapPatientDrugFromDb(data as DbPatientDrug);
}

export async function updatePatientDrug(id: string, input: UpdatePatientDrugInput): Promise<PatientDrug> {
  const db = requireSupabase();
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.dosage !== undefined) updateData.dosage = input.dosage;
  if (input.schedule !== undefined) updateData.schedule = JSON.stringify(input.schedule);
  if (input.duration !== undefined) updateData.duration = JSON.stringify(input.duration);
  if (input.startDate !== undefined) updateData.start_date = input.startDate;
  if (input.startTime !== undefined) updateData.start_time = input.startTime;
  if (input.endDate !== undefined) updateData.end_date = input.endDate;
  if (input.isPermanent !== undefined) updateData.is_permanent = input.isPermanent;
  if (input.nextPickupDate !== undefined) updateData.next_pickup_date = input.nextPickupDate;
  if (input.status !== undefined) updateData.status = input.status;

  const { data, error } = await db
    .from('patient_drugs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar tratamiento: ${error.message}`);
  return mapPatientDrugFromDb(data as DbPatientDrug);
}

export async function listPatientDrugsByPatient(patientId: string): Promise<PatientDrug[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('patient_drugs')
    .select()
    .eq('patient_id', patientId)
    .order('start_date', { ascending: false });

  if (error) throw new Error(`Error al listar tratamientos: ${error.message}`);
  return (data as DbPatientDrug[]).map(mapPatientDrugFromDb);
}

export async function listPatientDrugsByEvent(eventId: string): Promise<PatientDrug[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('patient_drugs')
    .select()
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Error al listar tratamientos: ${error.message}`);
  return (data as DbPatientDrug[]).map(mapPatientDrugFromDb);
}

export async function listActivePatientDrugs(patientId?: string): Promise<PatientDrug[]> {
  const db = requireSupabase();
  let query = db.from('patient_drugs').select().eq('status', 'active').order('name', { ascending: true });
  if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw new Error(`Error al listar tratamientos activos: ${error.message}`);
  return (data as DbPatientDrug[]).map(mapPatientDrugFromDb);
}

export async function listAllPatientDrugs(): Promise<PatientDrug[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('patient_drugs')
    .select()
    .order('name', { ascending: true });

  if (error) throw new Error(`Error al listar tratamientos: ${error.message}`);
  return (data as DbPatientDrug[]).map(mapPatientDrugFromDb);
}

export async function deletePatientDrug(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('patient_drugs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar tratamiento: ${error.message}`);
}

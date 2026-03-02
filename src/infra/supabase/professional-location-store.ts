import { supabase } from './client.js';
import type { Professional, Location } from '../../domain/models/professional-location.js';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase not configured.');
  return supabase;
}

// --- DB interfaces ---

interface DbProfessional {
  id: string;
  name: string;
  specialty: string | null;
  created_at: string;
}

interface DbLocation {
  id: string;
  name: string;
  created_at: string;
}

// --- Mappers ---

function mapProfessionalFromDb(row: DbProfessional): Professional {
  return {
    id: row.id,
    name: row.name,
    ...(row.specialty !== null && { specialty: row.specialty }),
    createdAt: row.created_at,
  };
}

function mapLocationFromDb(row: DbLocation): Location {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

// --- Professionals ---

export async function createProfessional(name: string, specialty?: string): Promise<Professional> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('professionals')
    .insert({
      name,
      specialty: specialty ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating professional: ${error.message}`);
  return mapProfessionalFromDb(data as DbProfessional);
}

export async function listProfessionals(): Promise<Professional[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('professionals')
    .select()
    .order('name', { ascending: true });

  if (error) throw new Error(`Error listing professionals: ${error.message}`);
  return (data as DbProfessional[]).map(mapProfessionalFromDb);
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('professionals')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw new Error(`Error getting professional: ${error.message}`);
  }
  return mapProfessionalFromDb(data as DbProfessional);
}

// --- Locations ---

export async function createLocation(name: string): Promise<Location> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('locations')
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(`Error creating location: ${error.message}`);
  return mapLocationFromDb(data as DbLocation);
}

export async function listLocations(): Promise<Location[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('locations')
    .select()
    .order('name', { ascending: true });

  if (error) throw new Error(`Error listing locations: ${error.message}`);
  return (data as DbLocation[]).map(mapLocationFromDb);
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('locations')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw new Error(`Error getting location: ${error.message}`);
  }
  return mapLocationFromDb(data as DbLocation);
}

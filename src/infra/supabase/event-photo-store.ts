import { supabase } from './client.js';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo.js';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase no configurado. Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

interface DbEventPhoto {
  id: string;
  evento_id: string;
  google_photos_url: string;
  google_photos_id: string;
  descripcion: string | null;
  creado_en: string;
}

function mapFromDb(row: DbEventPhoto): EventPhoto {
  return {
    id: row.id,
    eventId: row.evento_id,
    googlePhotosUrl: row.google_photos_url,
    googlePhotosId: row.google_photos_id,
    description: row.descripcion ?? undefined,
    createdAt: row.creado_en,
  };
}

export async function linkPhoto(input: LinkPhotoInput): Promise<EventPhoto> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('event_photos')
    .insert({
      evento_id: input.eventId,
      google_photos_url: input.googlePhotosUrl,
      google_photos_id: input.googlePhotosId,
      descripcion: input.description ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al vincular foto: ${error.message}`);
  return mapFromDb(data as DbEventPhoto);
}

export async function listPhotosByEvent(
  eventId: string
): Promise<EventPhoto[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('event_photos')
    .select()
    .eq('evento_id', eventId)
    .order('creado_en', { ascending: true });

  if (error) throw new Error(`Error al listar fotos: ${error.message}`);
  return (data as DbEventPhoto[]).map(mapFromDb);
}

export async function unlinkPhoto(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('event_photos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al desvincular foto: ${error.message}`);
}

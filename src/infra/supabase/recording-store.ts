import { supabase } from './client.js';
import type { EventRecording, CreateRecordingInput } from '../../domain/models/event-recording.js';

interface DbEventRecording {
  id: string;
  event_id: string;
  recording_url: string;
  file_name: string;
  duration_seconds: number | null;
  description: string | null;
  created_at: string;
}

function mapFromDb(row: DbEventRecording): EventRecording {
  return {
    id: row.id,
    eventId: row.event_id,
    recordingUrl: row.recording_url,
    fileName: row.file_name,
    durationSeconds: row.duration_seconds ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase not configured.');
  return supabase;
}

export async function createRecording(input: CreateRecordingInput): Promise<EventRecording> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('event_recordings')
    .insert({
      event_id: input.eventId,
      recording_url: input.recordingUrl,
      file_name: input.fileName,
      duration_seconds: input.durationSeconds ?? null,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Error saving recording: ${error.message}`);
  return mapFromDb(data as DbEventRecording);
}

export async function listRecordingsByEvent(eventId: string): Promise<EventRecording[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('event_recordings')
    .select()
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Error listing recordings: ${error.message}`);
  return (data as DbEventRecording[]).map(mapFromDb);
}

export async function deleteRecording(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from('event_recordings')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting recording: ${error.message}`);
}

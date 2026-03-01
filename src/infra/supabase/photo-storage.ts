import { supabase } from './client.js';
import { v4 as uuidv4 } from 'uuid';
import type { UploadResult } from '../../domain/services/photo-uploader.js';

const BUCKET = 'event-photos';

export async function uploadPhoto(eventId: string, file: File): Promise<UploadResult> {
  if (!supabase) throw new Error('Supabase no configurado');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${eventId}/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Error al subir foto: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: urlData.publicUrl, fileName: file.name };
}

export async function deletePhoto(url: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado');

  // Extract path from public URL
  const bucketUrl = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(bucketUrl);
  if (idx === -1) return;

  const path = url.substring(idx + bucketUrl.length);
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(`Error al eliminar foto: ${error.message}`);
}

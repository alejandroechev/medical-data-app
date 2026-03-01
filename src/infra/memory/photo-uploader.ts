import { v4 as uuidv4 } from 'uuid';
import type { UploadResult } from '../../domain/services/photo-uploader.js';

export class InMemoryPhotoUploader {
  private files: Map<string, { eventId: string; fileName: string }> = new Map();

  async upload(eventId: string, file: File): Promise<UploadResult> {
    const id = uuidv4();
    const url = `memory://event-photos/${eventId}/${id}-${file.name}`;
    this.files.set(url, { eventId, fileName: file.name });
    return { url, fileName: file.name };
  }

  async delete(url: string): Promise<void> {
    this.files.delete(url);
  }
}

import { v4 as uuidv4 } from 'uuid';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo.js';

export class InMemoryEventPhotoStore {
  private photos: Map<string, EventPhoto> = new Map();

  async vincular(input: LinkPhotoInput): Promise<EventPhoto> {
    const foto: EventPhoto = {
      id: uuidv4(),
      eventoId: input.eventoId,
      googlePhotosUrl: input.googlePhotosUrl,
      googlePhotosId: input.googlePhotosId,
      descripcion: input.descripcion,
      creadoEn: new Date().toISOString(),
    };
    this.photos.set(foto.id, foto);
    return { ...foto };
  }

  async listarPorEvento(eventoId: string): Promise<EventPhoto[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.eventoId === eventoId)
      .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
      .map((p) => ({ ...p }));
  }

  async desvincular(id: string): Promise<void> {
    this.photos.delete(id);
  }
}

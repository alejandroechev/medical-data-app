import { v4 as uuidv4 } from 'uuid';
import type { EventPhoto, LinkPhotoInput } from '../../domain/models/event-photo.js';

export class InMemoryEventPhotoStore {
  private photos: Map<string, EventPhoto> = new Map();

  async link(input: LinkPhotoInput): Promise<EventPhoto> {
    const photo: EventPhoto = {
      id: uuidv4(),
      eventId: input.eventId,
      googlePhotosUrl: input.googlePhotosUrl,
      googlePhotosId: input.googlePhotosId,
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    this.photos.set(photo.id, photo);
    return { ...photo };
  }

  async listByEvent(eventId: string): Promise<EventPhoto[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((p) => ({ ...p }));
  }

  async unlink(id: string): Promise<void> {
    this.photos.delete(id);
  }
}

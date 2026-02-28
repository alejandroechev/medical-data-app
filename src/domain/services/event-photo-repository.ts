import type { EventPhoto, LinkPhotoInput } from '../models/event-photo.js';

export interface EventPhotoRepository {
  link(input: LinkPhotoInput): Promise<EventPhoto>;
  listByEvent(eventId: string): Promise<EventPhoto[]>;
  unlink(id: string): Promise<void>;
}

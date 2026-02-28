import { EventPhoto, LinkPhotoInput } from '../models/event-photo.js';

export interface EventPhotoRepository {
  vincular(input: LinkPhotoInput): Promise<EventPhoto>;
  listarPorEvento(eventoId: string): Promise<EventPhoto[]>;
  desvincular(id: string): Promise<void>;
}

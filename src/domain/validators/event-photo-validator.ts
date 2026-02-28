import type { LinkPhotoInput } from '../models/event-photo.js';
import type { ValidationError, ValidationResult } from './medical-event-validator.js';

export function validateLinkPhoto(input: LinkPhotoInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.eventId || !input.eventId.trim()) {
    errors.push({ field: 'eventId', message: 'El ID del evento es obligatorio' });
  }

  if (!input.googlePhotosUrl || !input.googlePhotosUrl.trim()) {
    errors.push({ field: 'googlePhotosUrl', message: 'La URL de Google Photos es obligatoria' });
  }

  if (!input.googlePhotosId || !input.googlePhotosId.trim()) {
    errors.push({ field: 'googlePhotosId', message: 'El ID de Google Photos es obligatorio' });
  }

  return { valid: errors.length === 0, errors };
}

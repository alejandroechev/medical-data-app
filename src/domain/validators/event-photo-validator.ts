import { LinkPhotoInput } from '../models/event-photo.js';
import { ValidationError, ValidationResult } from './medical-event-validator.js';

export function validarVincularFoto(input: LinkPhotoInput): ValidationResult {
  const errores: ValidationError[] = [];

  if (!input.eventoId || !input.eventoId.trim()) {
    errores.push({ campo: 'eventoId', mensaje: 'El ID del evento es obligatorio' });
  }

  if (!input.googlePhotosUrl || !input.googlePhotosUrl.trim()) {
    errores.push({ campo: 'googlePhotosUrl', mensaje: 'La URL de Google Photos es obligatoria' });
  }

  if (!input.googlePhotosId || !input.googlePhotosId.trim()) {
    errores.push({ campo: 'googlePhotosId', mensaje: 'El ID de Google Photos es obligatorio' });
  }

  return { valido: errores.length === 0, errores };
}

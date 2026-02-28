import { EVENT_TYPES } from '../models/medical-event.js';
import type { CreateMedicalEventInput, EventType, UpdateMedicalEventInput } from '../models/medical-event.js';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function isValidEventType(type: string): type is EventType {
  return (EVENT_TYPES as readonly string[]).includes(type);
}

export function validateCreateEvent(input: CreateMedicalEventInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.date || !input.date.trim()) {
    errors.push({ field: 'date', message: 'La fecha es obligatoria' });
  } else if (!isValidDate(input.date)) {
    errors.push({ field: 'date', message: 'La fecha debe tener formato YYYY-MM-DD válido' });
  }

  if (!input.type || !input.type.trim()) {
    errors.push({ field: 'type', message: 'El tipo de evento es obligatorio' });
  } else if (!isValidEventType(input.type)) {
    errors.push({
      field: 'type',
      message: `Tipo inválido. Debe ser uno de: ${EVENT_TYPES.join(', ')}`,
    });
  }

  if (!input.description || !input.description.trim()) {
    errors.push({ field: 'description', message: 'La descripción es obligatoria' });
  }

  if (!input.patientId || !input.patientId.trim()) {
    errors.push({ field: 'patientId', message: 'El paciente es obligatorio' });
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateEvent(input: UpdateMedicalEventInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (input.date !== undefined) {
    if (!input.date.trim()) {
      errors.push({ field: 'date', message: 'La fecha no puede estar vacía' });
    } else if (!isValidDate(input.date)) {
      errors.push({ field: 'date', message: 'La fecha debe tener formato YYYY-MM-DD válido' });
    }
  }

  if (input.type !== undefined) {
    if (!input.type.trim()) {
      errors.push({ field: 'type', message: 'El tipo no puede estar vacío' });
    } else if (!isValidEventType(input.type)) {
      errors.push({
        field: 'type',
        message: `Tipo inválido. Debe ser uno de: ${EVENT_TYPES.join(', ')}`,
      });
    }
  }

  if (input.description !== undefined && !input.description.trim()) {
    errors.push({ field: 'description', message: 'La descripción no puede estar vacía' });
  }

  if (input.patientId !== undefined && !input.patientId.trim()) {
    errors.push({ field: 'patientId', message: 'El paciente no puede estar vacío' });
  }

  return { valid: errors.length === 0, errors };
}

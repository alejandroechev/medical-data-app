import { EVENT_TYPES } from '../models/medical-event.js';
import type { CreateMedicalEventInput, EventType, UpdateMedicalEventInput } from '../models/medical-event.js';

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export interface ValidationResult {
  valido: boolean;
  errores: ValidationError[];
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime());
}

function isValidEventType(tipo: string): tipo is EventType {
  return (EVENT_TYPES as readonly string[]).includes(tipo);
}

export function validarCrearEvento(input: CreateMedicalEventInput): ValidationResult {
  const errores: ValidationError[] = [];

  if (!input.fecha || !input.fecha.trim()) {
    errores.push({ campo: 'fecha', mensaje: 'La fecha es obligatoria' });
  } else if (!isValidDate(input.fecha)) {
    errores.push({ campo: 'fecha', mensaje: 'La fecha debe tener formato YYYY-MM-DD válido' });
  }

  if (!input.tipo || !input.tipo.trim()) {
    errores.push({ campo: 'tipo', mensaje: 'El tipo de evento es obligatorio' });
  } else if (!isValidEventType(input.tipo)) {
    errores.push({
      campo: 'tipo',
      mensaje: `Tipo inválido. Debe ser uno de: ${EVENT_TYPES.join(', ')}`,
    });
  }

  if (!input.descripcion || !input.descripcion.trim()) {
    errores.push({ campo: 'descripcion', mensaje: 'La descripción es obligatoria' });
  }

  if (!input.pacienteId || !input.pacienteId.trim()) {
    errores.push({ campo: 'pacienteId', mensaje: 'El paciente es obligatorio' });
  }

  return { valido: errores.length === 0, errores };
}

export function validarActualizarEvento(input: UpdateMedicalEventInput): ValidationResult {
  const errores: ValidationError[] = [];

  if (input.fecha !== undefined) {
    if (!input.fecha.trim()) {
      errores.push({ campo: 'fecha', mensaje: 'La fecha no puede estar vacía' });
    } else if (!isValidDate(input.fecha)) {
      errores.push({ campo: 'fecha', mensaje: 'La fecha debe tener formato YYYY-MM-DD válido' });
    }
  }

  if (input.tipo !== undefined) {
    if (!input.tipo.trim()) {
      errores.push({ campo: 'tipo', mensaje: 'El tipo no puede estar vacío' });
    } else if (!isValidEventType(input.tipo)) {
      errores.push({
        campo: 'tipo',
        mensaje: `Tipo inválido. Debe ser uno de: ${EVENT_TYPES.join(', ')}`,
      });
    }
  }

  if (input.descripcion !== undefined && !input.descripcion.trim()) {
    errores.push({ campo: 'descripcion', mensaje: 'La descripción no puede estar vacía' });
  }

  if (input.pacienteId !== undefined && !input.pacienteId.trim()) {
    errores.push({ campo: 'pacienteId', mensaje: 'El paciente no puede estar vacío' });
  }

  return { valido: errores.length === 0, errores };
}

import { describe, it, expect } from 'vitest';
import { EVENT_TYPES } from '../../../src/domain/models/medical-event';

describe('MedicalEvent Model', () => {
  it('debe tener todos los tipos de evento definidos', () => {
    expect(EVENT_TYPES).toContain('Consulta Médica');
    expect(EVENT_TYPES).toContain('Consulta Dental');
    expect(EVENT_TYPES).toContain('Urgencia');
    expect(EVENT_TYPES).toContain('Cirugía');
    expect(EVENT_TYPES).toContain('Examen');
    expect(EVENT_TYPES).toContain('Otro');
  });

  it('debe tener exactamente 6 tipos de evento', () => {
    expect(EVENT_TYPES).toHaveLength(6);
  });
});
